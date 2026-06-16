package co.edu.cue.practicas.service.notificacion;

import co.edu.cue.practicas.config.singleton.SystemConfig;
import co.edu.cue.practicas.model.entity.Usuario;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Servicio de envio de correos via Resend API.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final URI RESEND_EMAILS_URI = URI.create("https://api.resend.com/emails");

    private final SystemConfig systemConfig;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${resend.from.email:onboarding@resend.dev}")
    private String resendFromEmail;

    @Async
    public void enviarPasswordTemporal(String destinatario, String nombre, String passwordTemporal) {
        String asunto = "Acceso al " + systemConfig.getNombreSistema();
        String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a365d;">%s</h2>
                    <p>Estimado/a <strong>%s</strong>,</p>
                    <p>Se ha creado tu cuenta en el <strong>%s</strong> de la <strong>%s</strong>.</p>
                    <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Correo:</strong> %s</p>
                        <p style="margin: 8px 0 0 0;"><strong>Contrasena temporal:</strong> <code style="background: #edf2f7; padding: 4px 8px; border-radius: 4px; font-size: 16px;">%s</code></p>
                    </div>
                    <p style="color: #e53e3e;"><strong>Debes cambiar tu contrasena en el primer inicio de sesion.</strong></p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="color: #718096; font-size: 12px;">Este es un mensaje automatico. No respondas a este correo.</p>
                </div>
                """.formatted(
                systemConfig.getNombreSistema(),
                nombre,
                systemConfig.getNombreSistema(),
                systemConfig.getNombreUniversidad(),
                destinatario,
                passwordTemporal
        );

        enviarCorreo(destinatario, asunto, html, "contrasena temporal");
    }

    @Async
    public void enviarCodigoVerificacionCorreo(String destinatario, String nombre, String codigo) {
        String asunto = "Codigo de verificacion - " + systemConfig.getNombreSistema();
        String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a365d;">%s</h2>
                    <p>Estimado/a <strong>%s</strong>,</p>
                    <p>Se ha solicitado un cambio de correo electronico en tu cuenta. Usa el siguiente codigo para confirmar la operacion:</p>
                    <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 20px 0; text-align: center;">
                        <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a365d;">%s</p>
                    </div>
                    <p style="color: #718096; font-size: 13px;">Este codigo es valido por <strong>10 minutos</strong>. Si no solicitaste este cambio, ignora este mensaje.</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="color: #718096; font-size: 12px;">Este es un mensaje automatico. No respondas a este correo.</p>
                </div>
                """.formatted(systemConfig.getNombreSistema(), nombre, codigo);

        enviarCorreo(destinatario, asunto, html, "codigo de verificacion");
    }

    @Async
    public void enviarCodigoLogin(String destinatario, String nombre, String codigo) {
        String asunto = "Codigo de acceso - " + systemConfig.getNombreSistema();
        String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a365d;">%s</h2>
                    <p>Estimado/a <strong>%s</strong>,</p>
                    <p>Se ha solicitado un inicio de sesion en tu cuenta. Usa el siguiente codigo para completar el acceso:</p>
                    <div style="background: #ebf8ff; border: 2px solid #3182ce; border-radius: 12px; padding: 28px; margin: 24px 0; text-align: center;">
                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #2b6cb0; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Codigo de verificacion</p>
                        <p style="margin: 0; font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #1a365d;">%s</p>
                    </div>
                    <p style="color: #718096; font-size: 13px;">Este codigo es valido por <strong>10 minutos</strong>. Si no intentaste iniciar sesion, ignora este mensaje y considera cambiar tu contrasena.</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="color: #718096; font-size: 12px;">Este es un mensaje automatico. No respondas a este correo.</p>
                </div>
                """.formatted(systemConfig.getNombreSistema(), nombre, codigo);

        enviarCorreo(destinatario, asunto, html, "codigo de acceso 2FA");
    }

    @Async
    public void notificarNuevoEstudiante(Usuario estudiante) {
        log.info("[EMAIL] Notificacion de nuevo estudiante pendiente: {} -> Coordinacion Academica", estudiante.getNombre());
        // En Sprint 2 se implementa la consulta de coordinadores por facultad para notificarlos.
    }

    @Async
    public void notificarAsignacion(String destinatario, String nombreDestinatario, String mensajeHtml, String asunto) {
        int attempts = systemConfig.getMailRetryAttempts();
        long delayMs = systemConfig.getMailRetryDelayMs();
        for (int i = 1; i <= attempts; i++) {
            boolean enviado = enviarCorreo(
                    destinatario,
                    asunto != null ? asunto : "Notificacion de asignacion - " + systemConfig.getNombreSistema(),
                    mensajeHtml,
                    "notificacion de asignacion"
            );
            if (enviado) {
                log.info("[EMAIL] Notificacion de asignacion enviada a: {} (intento {}/{})", destinatario, i, attempts);
                return;
            }
            if (i < attempts) {
                try {
                    Thread.sleep(delayMs);
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
    }

    private boolean enviarCorreo(String destinatario, String asunto, String html, String tipo) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.error("[EMAIL] RESEND_API_KEY no configurada. No se pudo enviar {} a {}", tipo, destinatario);
            return false;
        }

        try {
            String body = """
                    {"from":"%s","to":["%s"],"subject":"%s","html":"%s"}
                    """.formatted(
                    jsonEscape(resendFromEmail),
                    jsonEscape(destinatario),
                    jsonEscape(asunto),
                    jsonEscape(html)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(RESEND_EMAILS_URI)
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();

            if (status >= 200 && status < 300) {
                log.info("[EMAIL] {} enviado con Resend a: {}", tipo, destinatario);
                return true;
            }

            log.error("[EMAIL] Resend error enviando {} a {}. Status: {} Body: {}",
                    tipo, destinatario, status, response.body());
            return false;
        } catch (Exception e) {
            log.error("[EMAIL] Error enviando {} con Resend a {}: {}", tipo, destinatario, e.getMessage());
            return false;
        }
    }

    private String jsonEscape(String value) {
        if (value == null) {
            return "";
        }

        StringBuilder escaped = new StringBuilder(value.length());
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"' -> escaped.append("\\\"");
                case '\\' -> escaped.append("\\\\");
                case '\b' -> escaped.append("\\b");
                case '\f' -> escaped.append("\\f");
                case '\n' -> escaped.append("\\n");
                case '\r' -> escaped.append("\\r");
                case '\t' -> escaped.append("\\t");
                default -> {
                    if (c < 0x20) {
                        escaped.append(String.format("\\u%04x", (int) c));
                    } else {
                        escaped.append(c);
                    }
                }
            }
        }
        return escaped.toString();
    }
}
