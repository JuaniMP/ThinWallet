package co.edu.unbosque.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Base64;

@Configuration
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true")
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.service-account-base64}")
    private String serviceAccountBase64;

    @Bean
    public FirebaseApp firebaseApp() {
        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                return FirebaseApp.getInstance();
            }
            byte[] decoded = Base64.getDecoder().decode(serviceAccountBase64);
            InputStream is = new ByteArrayInputStream(decoded);
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(is))
                    .build();
            FirebaseApp app = FirebaseApp.initializeApp(options);
            log.info("Firebase Admin SDK inicializado correctamente");
            return app;
        } catch (Exception e) {
            log.error("Error inicializando Firebase Admin SDK: {}", e.getMessage());
            throw new RuntimeException("Firebase init failed: " + e.getMessage(), e);
        }
    }
}
