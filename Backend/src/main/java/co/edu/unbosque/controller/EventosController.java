package co.edu.unbosque.controller;

import co.edu.unbosque.service.SseEventBus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * RF-07 — Endpoints Server-Sent Events para sincronización en tiempo real.
 * El frontend abre una conexión persistente con EventSource y recibe
 * eventos {@code saldo} y {@code deudas} cuando cambian.
 */
@RestController
@RequestMapping("/api/eventos")
@RequiredArgsConstructor
public class EventosController {

    private final SseEventBus eventBus;

    @GetMapping(path = "/saldos/{idUsuario}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter saldos(@PathVariable Long idUsuario) {
        return eventBus.registrar(idUsuario);
    }
}
