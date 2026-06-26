package com.hrplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class HrPlatformApplication {
    public static void main(String[] args) {
        SpringApplication.run(HrPlatformApplication.class, args);
    }
}
