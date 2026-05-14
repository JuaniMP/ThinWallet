package co.edu.unbosque.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "usuario_gasto")
@Data
public class UsuarioGasto {

    @EmbeddedId
    private UsuarioGastoId id;

    // Helpers de acceso directo usados por GastoService
    public Long getIdUsuario() {
        return id != null ? id.getIdUsuario() : null;
    }

    public Long getIdGasto() {
        return id != null ? id.getIdGasto() : null;
    }

    public void setIdUsuario(Long idUsuario) {
        if (id == null) id = new UsuarioGastoId();
        id.setIdUsuario(idUsuario);
    }

    public void setIdGasto(Long idGasto) {
        if (id == null) id = new UsuarioGastoId();
        id.setIdGasto(idGasto);
    }
}
