package co.edu.unbosque.dto;

import co.edu.unbosque.entity.Usuario;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private Usuario usuario;
}
