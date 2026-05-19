package co.edu.unbosque.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true")
public class FcmService {

    @SuppressWarnings("unused")
    private final FirebaseApp firebaseApp; // garantiza que Firebase esté inicializado

    public void enviarNotificacion(String fcmToken, String titulo, String cuerpo) {
        try {
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(titulo)
                            .setBody(cuerpo)
                            .build())
                    .build();
            String response = FirebaseMessaging.getInstance().send(message);
            log.info("FCM push enviado: {}", response);
        } catch (FirebaseMessagingException e) {
            log.warn("Error enviando FCM push: {}", e.getMessage());
        }
    }
}
