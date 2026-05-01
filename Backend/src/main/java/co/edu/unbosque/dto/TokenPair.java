package co.edu.unbosque.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Estructura interna para manejar tokens en su forma original y hasheada
 */
@Data
@AllArgsConstructor
public class TokenPair {
    private String original;  // Token sin hashear (para darlo al usuario)
    private String hashed;    // Token hasheado (para guardar en BD)
}
