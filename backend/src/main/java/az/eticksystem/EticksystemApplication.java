package az.eticksystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync // Включает @Async для EmailService
@SpringBootApplication
public class EticksystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(EticksystemApplication.class, args);
    }
}