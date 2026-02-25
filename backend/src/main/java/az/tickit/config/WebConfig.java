package az.tickit.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Связываем URL /uploads/ с реальной папкой uploads на диске
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }
}