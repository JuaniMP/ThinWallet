package co.edu.unbosque.config;

import co.edu.unbosque.entity.Usuario;
import co.edu.unbosque.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UsuarioAutenticadoTest {

    private final UsuarioRepository repository = mock(UsuarioRepository.class);
    private final UsuarioAutenticado usuarioAutenticado = new UsuarioAutenticado(repository);

    @BeforeEach
    void iniciarSesionComoAna() {
        Usuario ana = new Usuario();
        ana.setIdUsuario(1L);
        ana.setCorreo("ana@demo.com");
        when(repository.findByCorreo("ana@demo.com")).thenReturn(Optional.of(ana));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("ana@demo.com", null, List.of()));
    }

    @AfterEach
    void limpiar() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void resuelveElIdDelCorreoDelToken() {
        assertThat(usuarioAutenticado.id()).isEqualTo(1L);
    }

    @Test
    void permiteAccederAsusPropiosDatos() {
        assertThatCode(() -> usuarioAutenticado.exigirQueSea(1L)).doesNotThrowAnyException();
    }

    @Test
    void bloqueaElAccesoADatosDeOtroUsuario() {
        assertThatThrownBy(() -> usuarioAutenticado.exigirQueSea(2L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void rechazaPeticionesSinSesion() {
        SecurityContextHolder.clearContext();
        assertThatThrownBy(usuarioAutenticado::id).isInstanceOf(AccessDeniedException.class);
    }
}
