package co.edu.unbosque.service;

import co.edu.unbosque.entity.Transaccion;
import co.edu.unbosque.entity.Deuda;
import co.edu.unbosque.entity.Gasto;
import co.edu.unbosque.repository.TransaccionRepository;
import co.edu.unbosque.repository.DeudaRepository;
import co.edu.unbosque.repository.GastoRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReporteService {

    private final TransaccionRepository transaccionRepository;
    private final DeudaRepository deudaRepository;
    private final GastoRepository gastoRepository;
    private final JdbcTemplate jdbcTemplate;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DeviceRgb COLOR_HEADER = new DeviceRgb(83, 97, 57);   // verde primario
    private static final DeviceRgb COLOR_ROW_ALT = new DeviceRgb(232, 244, 220);

    // ── PDF ───────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] generarPdfUsuario(Long idUsuario) {
        List<Transaccion> txs = transaccionRepository.findByIdUsuario(idUsuario);
        List<Deuda> deudas = deudaRepository.findByDeudor(idUsuario);
        List<Gasto> metas = gastoRepository.findByIdUsuarioCreador(idUsuario).stream()
                .filter(g -> "META".equals(g.getPeriodicidad())).toList();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document doc = new Document(pdf);

        // Título
        doc.add(new Paragraph("THIN WALLET — Estado de Cuenta")
                .setFontSize(20).setBold().setFontColor(COLOR_HEADER)
                .setTextAlignment(TextAlignment.CENTER).setMarginBottom(4));
        doc.add(new Paragraph("Usuario ID: " + idUsuario + " | Generado: " + LocalDateTime.now().format(FMT))
                .setFontSize(9).setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER).setMarginBottom(20));

        // Resumen: usar categoria.tipo_categoria para distinguir ingresos de gastos
        // (tipoMovimiento es @Transient y viene null al cargar desde el repositorio)
        String sqlResumen = """
                SELECT
                    SUM(CASE WHEN UPPER(c.tipo_categoria) = 'DEPOSITO'
                              OR (UPPER(c.tipo_categoria) = 'AMBOS' AND UPPER(t.contexto) = 'DEPOSITO')
                             THEN t.monto_original ELSE 0 END) AS total_ingresos,
                    SUM(CASE WHEN UPPER(c.tipo_categoria) NOT IN ('DEPOSITO')
                              AND NOT (UPPER(c.tipo_categoria) = 'AMBOS' AND UPPER(t.contexto) = 'DEPOSITO')
                             THEN t.monto_original ELSE 0 END) AS total_gastos
                FROM transaccion t
                INNER JOIN categoria c ON t.id_categoria = c.id_categoria
                WHERE t.id_usuario = ?
                  AND t.id_circulo_gasto IS NULL
                """;

        BigDecimal[] resumenVals = jdbcTemplate.queryForObject(sqlResumen, (rs, rn) -> new BigDecimal[]{
                rs.getBigDecimal("total_ingresos"),
                rs.getBigDecimal("total_gastos")
        }, idUsuario);

        BigDecimal totalIngresos = resumenVals != null && resumenVals[0] != null ? resumenVals[0] : BigDecimal.ZERO;
        BigDecimal totalGastos   = resumenVals != null && resumenVals[1] != null ? resumenVals[1] : BigDecimal.ZERO;

        doc.add(new Paragraph("RESUMEN FINANCIERO").setFontSize(13).setBold().setFontColor(COLOR_HEADER).setMarginBottom(6));
        Table resumen = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();
        resumen.addCell(celda("Total Ingresos", true));
        resumen.addCell(celda(formatCOP(totalIngresos), true));
        resumen.addCell(celda("Total Gastos", false));
        resumen.addCell(celda(formatCOP(totalGastos), false));
        resumen.addCell(celda("Balance Neto", true));
        resumen.addCell(celda(formatCOP(totalIngresos.subtract(totalGastos)), true));
        resumen.addCell(celda("Total Transacciones", false));
        resumen.addCell(celda(String.valueOf(txs.size()), false));
        doc.add(resumen);
        doc.add(new Paragraph(" "));

        // Transacciones
        doc.add(new Paragraph("TRANSACCIONES").setFontSize(13).setBold().setFontColor(COLOR_HEADER).setMarginBottom(6));
        if (txs.isEmpty()) {
            doc.add(new Paragraph("Sin transacciones registradas.").setFontSize(9).setFontColor(ColorConstants.GRAY));
        } else {
            Table t = new Table(UnitValue.createPercentArray(new float[]{30, 20, 20, 30})).useAllAvailableWidth();
            addHeaderRow(t, "Nombre", "Monto (COP)", "Tipo", "Moneda");
            for (int i = 0; i < txs.size(); i++) {
                Transaccion tx = txs.get(i);
                boolean alt = i % 2 == 0;
                t.addCell(celdaData(tx.getNombre() != null ? tx.getNombre() : "-", alt));
                t.addCell(celdaData(formatCOP(tx.getMontoOriginal()), alt));
                t.addCell(celdaData(tx.getTipoMovimiento() != null ? tx.getTipoMovimiento() : "-", alt));
                t.addCell(celdaData(tx.getMonedaOriginal() != null ? tx.getMonedaOriginal() : "COP", alt));
            }
            doc.add(t);
        }
        doc.add(new Paragraph(" "));

        // Deudas pendientes
        List<Deuda> pendientes = deudas.stream().filter(d -> "PENDIENTE".equals(d.getEstadoPago())).toList();
        doc.add(new Paragraph("DEUDAS PENDIENTES").setFontSize(13).setBold().setFontColor(COLOR_HEADER).setMarginBottom(6));
        if (pendientes.isEmpty()) {
            doc.add(new Paragraph("Sin deudas pendientes.").setFontSize(9).setFontColor(ColorConstants.GRAY));
        } else {
            Table td = new Table(UnitValue.createPercentArray(new float[]{40, 30, 30})).useAllAvailableWidth();
            addHeaderRow(td, "Monto", "Método Pago", "Estado");
            for (int i = 0; i < pendientes.size(); i++) {
                Deuda d = pendientes.get(i);
                boolean alt = i % 2 == 0;
                td.addCell(celdaData(formatCOP(d.getMonto()), alt));
                td.addCell(celdaData(d.getMetodoPagoSugerido() != null ? d.getMetodoPagoSugerido() : "-", alt));
                td.addCell(celdaData(d.getEstadoPago(), alt));
            }
            doc.add(td);
        }
        doc.add(new Paragraph(" "));

        // Metas de ahorro
        doc.add(new Paragraph("METAS DE AHORRO").setFontSize(13).setBold().setFontColor(COLOR_HEADER).setMarginBottom(6));
        if (metas.isEmpty()) {
            doc.add(new Paragraph("Sin metas definidas.").setFontSize(9).setFontColor(ColorConstants.GRAY));
        } else {
            Table tm = new Table(UnitValue.createPercentArray(new float[]{50, 25, 25})).useAllAvailableWidth();
            addHeaderRow(tm, "Meta", "Valor Objetivo", "Vence");
            for (int i = 0; i < metas.size(); i++) {
                Gasto g = metas.get(i);
                boolean alt = i % 2 == 0;
                tm.addCell(celdaData(g.getNombre() != null ? g.getNombre() : "-", alt));
                tm.addCell(celdaData(formatCOP(g.getValor()), alt));
                tm.addCell(celdaData(g.getFechaFin() != null ? g.getFechaFin().format(FMT) : "Sin fecha", alt));
            }
            doc.add(tm);
        }

        doc.close();
        return baos.toByteArray();
    }

    // ── CSV ───────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] generarCsvTransacciones(Long idUsuario) {
        List<Transaccion> txs = transaccionRepository.findByIdUsuario(idUsuario);
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Nombre,Monto,Moneda,Tipo,ModalidadDivision,Contexto\n");
        for (Transaccion t : txs) {
            sb.append(t.getIdTransaccion()).append(",")
              .append(csv(t.getNombre())).append(",")
              .append(t.getMontoOriginal() != null ? t.getMontoOriginal() : "0").append(",")
              .append(csv(t.getMonedaOriginal())).append(",")
              .append(csv(t.getTipoMovimiento())).append(",")
              .append(csv(t.getModalidadDivision())).append(",")
              .append(csv(t.getContexto())).append("\n");
        }
        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String formatCOP(BigDecimal val) {
        if (val == null) return "$0";
        return "$" + String.format("%,.0f", val);
    }

    private String csv(String s) {
        if (s == null) return "";
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }

    private Cell celda(String text, boolean bold) {
        Cell c = new Cell().add(new Paragraph(text).setFontSize(10));
        if (bold) c.setBold();
        return c;
    }

    private Cell celdaData(String text, boolean alt) {
        Cell c = new Cell().add(new Paragraph(text).setFontSize(9));
        if (alt) c.setBackgroundColor(COLOR_ROW_ALT);
        return c;
    }

    private void addHeaderRow(Table t, String... headers) {
        for (String h : headers) {
            t.addHeaderCell(new Cell()
                    .add(new Paragraph(h).setFontSize(10).setBold().setFontColor(ColorConstants.WHITE))
                    .setBackgroundColor(COLOR_HEADER));
        }
    }
}
