package co.edu.unbosque.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;

    public void enviarCodigoRecuperacion(String emailTo, String codigo) {
        log.info("Enviando correo de recuperacion a {}", emailTo);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("ThinWalletTeam@gmail.com");
            message.setTo(emailTo);
            message.setSubject("ThinWallet - Recuperacion de Contrasena");
            message.setText("Hola,\n\n" +
                    "Has solicitado restablecer tu contrasena. Tu codigo de verificacion temporal es:\n\n" +
                    codigo + "\n\n" +
                    "Si no fuiste tu, por favor ignora este correo.\n\n" +
                    "Atentamente,\n" +
                    "Equipo de ThinWallet");
            javaMailSender.send(message);
            log.info("Correo de recuperacion enviado exitosamente a {}", emailTo);
        } catch (Exception e) {
            log.error("Fallo al enviar el correo a {}: {}", emailTo, e.getMessage());
            throw new RuntimeException("Error al enviar el correo de recuperacion, por favor intente nuevamente mas tarde", e);
        }
    }

    public void enviarCodigoVerificacion(String emailTo, String codigo) {
        log.info("Enviando correo de verificacion de registro a {}", emailTo);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("ThinWalletTeam@gmail.com");
            message.setTo(emailTo);
            message.setSubject("ThinWallet - Verificacion de cuenta");
            message.setText("Hola,\n\n" +
                    "Gracias por registrarte en ThinWallet. Tu codigo de verificacion para activar tu cuenta es:\n\n" +
                    codigo + "\n\n" +
                    "Por favor, ingresa este codigo en la aplicacion para completar tu registro.\n\n" +
                    "Atentamente,\n" +
                    "Equipo de ThinWallet");
            javaMailSender.send(message);
            log.info("Correo de verificacion enviado exitosamente a {}", emailTo);
        } catch (Exception e) {
            log.error("Fallo al enviar el correo de verificacion a {}: {}", emailTo, e.getMessage());
            throw new RuntimeException("Error al enviar el correo de verificacion", e);
        }
    }
}
