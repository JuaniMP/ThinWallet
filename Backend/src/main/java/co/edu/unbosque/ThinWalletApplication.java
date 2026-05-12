package co.edu.unbosque;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ThinWalletApplication {

    public static void main(String[] args) {
        SpringApplication.run(ThinWalletApplication.class, args);
    }

}