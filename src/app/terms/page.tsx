import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de Servicio | Orion Stream",
  description: "Términos de Servicio de Orion Stream",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Términos de Servicio
        </h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              1. Aceptación de los Términos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Al acceder y utilizar Orion Stream ("el Servicio"), usted acepta estar sujeto a estos
              Términos de Servicio y a todas las leyes y regulaciones aplicables. Si no está de acuerdo
              con alguno de estos términos, se le prohíbe el uso o acceso a este Servicio.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              2. Uso del Servicio
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              El Servicio se proporciona únicamente para uso personal y no comercial. Usted se compromete
              a utilizar el Servicio de manera legal y de acuerdo con estos Términos. Queda prohibido:
              utilizar el Servicio para cualquier propósito ilegal, intentar obtener acceso no autorizado
              a cualquier parte del Servicio, interferir con el funcionamiento del Servicio, o recopilar
              información sobre otros usuarios sin su consentimiento.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              3. Contenido
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Orion Stream proporciona acceso a contenido de terceros, incluyendo canales de televisión
              en vivo. No nos hacemos responsables del contenido proporcionado por terceros. El contenido
              disponible a través del Servicio puede estar protegido por derechos de autor y otras leyes
              de propiedad intelectual. Usted es responsable de garantizar que su uso del contenido
              cumpla con todas las leyes aplicables.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              4. Cuenta de Usuario
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Para utilizar ciertas funciones del Servicio, es posible que deba crear una cuenta. Usted
              es responsable de mantener la confidencialidad de su cuenta y de todas las actividades que
              ocurran bajo su cuenta. Se le prohíbe crear una cuenta si es menor de 13 años. Nos reservamos
              el derecho de suspender o terminar su cuenta en cualquier momento si viola estos Términos.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              5. Limitación de Responsabilidad
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              El Servicio se proporciona "tal cual" y "según disponibilidad", sin garantías de ningún tipo,
              ya sean expresas o implícitas. En ningún caso Orion Stream, sus directores, empleados,
              socios, agentes, proveedores o afiliados serán responsables de daños indirectos, incidentales,
              especiales, consecuentes o punitivos, incluyendo, sin limitación, pérdida de beneficios,
              datos, uso u otra pérdida intangible.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              6. Modificaciones
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las modificaciones
              entrarán en vigor inmediatamente después de su publicación en el Servicio. Su uso continuado
              del Servicio después de la publicación de los Términos revisados significa que acepta y está
              de acuerdo con los cambios.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              7. Contacto
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Si tiene alguna pregunta sobre estos Términos, por favor contáctenos a través de los canales
              oficiales de soporte del Servicio.
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
