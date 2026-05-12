package co.edu.unbosque.document;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * Documento MongoDB equivalente a la entidad Categoria.
 * Colección: "categorias"
 */
@Data
@Document(collection = "categorias")
public class CategoriaDocument {

    @Id
    private String id;

    // ID numérico propio para mantener compatibilidad con el sistema (se auto-genera en CategoriaMongoStore)
    @Field("id_categoria")
    private Long idCategoria;

    @Field("nombre")
    private String nombre;

    @Field("descripcion")
    private String descripcion;

    @Field("tipo_categoria")
    private String tipoCategoria;

    @Field("exclusiva_perfil_solo")
    private Boolean exclusivaPerfilSolo;

    @Field("frecuencia_uso")
    private Integer frecuenciaUso;

    @Field("estado")
    private Integer estado;

    @Field("id_circulo_gasto")
    private Long idCirculoGasto;
}
