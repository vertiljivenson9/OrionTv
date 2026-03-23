import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | Orion Stream",
  description: "Política de Privacidad de Orion Stream",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Política de Privacidad
        </h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              1. Información que Recopilamos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Cuando utiliza Orion Stream, podemos recopilar la siguiente información: información de
              identificación personal (nombre, dirección de correo electrónico, foto de perfil) que
              usted proporciona al registrarse a través de Google; información sobre su uso del Servicio,
              incluyendo los canales que ve y sus favoritos; información del dispositivo, incluyendo el
              tipo de dispositivo, sistema operativo y navegador web; y datos de ubicación aproximada
              basada en su dirección IP.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              2. Cómo Utilizamos su Información
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos la información recopilada para: proporcionar, operar y mantener nuestro Servicio;
              mejorar, personalizar y expandir nuestro Servicio; comprender y analizar cómo utiliza nuestro
              Servicio; desarrollar nuevos productos, servicios, características y funcionalidades;
              comunicarnos con usted para proporcionarle actualizaciones y otra información relacionada
              con el Servicio; y detectar y prevenir fraudes u otras actividades ilegales.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              3. Autenticación de Google
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Orion Stream utiliza Google para la autenticación de usuarios. Cuando inicia sesión con Google,
              recibimos su nombre, dirección de correo electrónico y foto de perfil. No almacenamos su
              contraseña de Google. Puede revocar el acceso de Orion Stream a su cuenta de Google en
              cualquier momento desde la configuración de su cuenta de Google.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              4. Almacenamiento de Datos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Sus datos se almacenan de forma segura utilizando los servicios de Firebase de Google.
              Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger
              su información personal contra acceso no autorizado, alteración, divulgación o destrucción.
              Sus favoritos y preferencias se almacenan asociados a su cuenta de usuario.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              5. Compartir Información
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              No vendemos, intercambiamos ni transferimos de ninguna otra manera su información personal
              a terceros. Solo compartimos su información en las siguientes circunstancias: con proveedores
              de servicios que nos ayudan a operar el Servicio; si somos requeridos por ley para divulgar
              información; para proteger nuestros derechos, propiedad o seguridad; y con su consentimiento.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              6. Sus Derechos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Tiene derecho a: acceder a su información personal; corregir información inexacta; solicitar
              la eliminación de su información personal; oponerse al procesamiento de su información
              personal; y solicitar la portabilidad de su información personal. Para ejercer cualquiera
              de estos derechos, contáctenos a través de los canales oficiales de soporte.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              7. Cookies y Tecnología Similar
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies y tecnologías similares para mejorar su experiencia en el Servicio.
              Las cookies son pequeños archivos de datos almacenados en su dispositivo. Puede configurar
              su navegador para rechazar cookies, pero esto puede afectar la funcionalidad del Servicio.
              También utilizamos almacenamiento local para guardar sus preferencias.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              8. Menores de Edad
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              El Servicio no está dirigido a menores de 13 años. No recopilamos conscientemente información
              personal de menores de 13 años. Si nos enteramos de que hemos recopilado información personal
              de un menor de 13 años, tomaremos medidas para eliminar esa información.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              9. Cambios a esta Política
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos actualizar nuestra Política de Privacidad de vez en cuando. Le notificaremos
              cualquier cambio publicando la nueva Política de Privacidad en esta página y actualizando
              la fecha de "Última actualización". Se le recomienda revisar esta Política de Privacidad
              periódicamente para cualquier cambio.
            </p>
          </section>

          <p className="text-sm text-muted-foreground text-center mt-8">
            Última actualización: Marzo 2024
          </p>
        </div>
      </div>
    </div>
  );
}
