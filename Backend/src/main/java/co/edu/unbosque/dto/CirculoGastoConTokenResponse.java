package co.edu.unbosque.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Respuesta cuando se crea un círculo de gasto con token de invitación.
 * El token se devuelve en texto plano SOLO en este momento.
 * En la BD se guarda hasheado por seguridad.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CirculoGastoConTokenResponse {
    private Long idCirculoGasto;
    private String nombre;
    private String tipoCirculo;
    private String tokenInvitacion; // Token en TEXTO PLANO (solo se muestra una vez)
    private String mensaje; // Mensaje informativo sobre el token
    private Long idUsuarioCreador;
}
