import { AppleFeatureLaurelsBadge } from "@/components/apple_feature_laurels_badge/apple_feature_laurels_badge";
import { CardGrid } from "@/components/card_grid/card_grid";
import { DownloadActionButton } from "@/components/download_action_button/download_action_button";
import { EmailForm } from "@/components/email_form/email_form";
import { Hero } from "@/components/hero/hero";
import { RatingLaurelsBadge } from "@/components/rating_laurels_badge/rating_laurels_badge";
import { Section } from "@/components/section/section";
import { TestimonialsGrid } from "@/components/testimonials_grid/testimonials_grid";
import { ContactForm } from "@/components/contact_form/contact_form";
import { IS_WAITLIST_ENABLED } from "@/constants";

import styles from "./page.module.css";

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px 18px",
  borderRadius: 18,
  border: "1px solid var(--color-fill-0)",
  background: "var(--color-fill-0)",
  color: "var(--color-text-primary)",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
  transition: "all .2s ease",
};

export default function Page() {

  if (IS_WAITLIST_ENABLED) {
    return (
      <>
        <div className={styles.waitlistSpacer} />

        <Section paddingTop={60}>
          <Hero
            title="Rutea MX"
            subtitle="Explora México con su transporte público. Conecta con la ciudad."
            media={
              <Hero.Image
                src="/hero_section_ss.png"
                alt=""
                bezel="iPhone Air Light Gold"
              />
            }
            action={
              <>
                <EmailForm
                  providerConfig={{
                    provider: "loops",
                    config: {
                      formId: "your-loops-form-id",
                    },
                  }}
                />
                {/*
                  You can also use a simple button to redirect users
                  to a custom page where you collect emails
                */}
                {/* <GetNotifiedActionButton href="your-email-form-link" /> */}
              </>
            }
          />
        </Section>
      </>
    );
  }

  return (
    <>
      <Section paddingTop={100}>
        <Hero
          title="Rutea MX"
          subtitle="Explora México con su transporte público. Conecta con la ciudad."
          media={
            <Hero.Image
              src="/hero_section_ss.png"
              bezel="iPhone Air Light Gold"
              alt=""
            />
          }
          // badges={
          //   <>
          //     <RatingLaurelsBadge
          //       showStars={true}
          //       rating={4.9}
          //       caption="worldwide rating"
          //     />
          //     <AppleFeatureLaurelsBadge featureName="App of the Day" />
          //   </>
          // }
          action={<DownloadActionButton size="medium" />}
        />
      </Section>

      <Section navigationAnchor="features">
        <CardGrid rowHeight={438}>
          <CardGrid.StackedCard
            maxWidth="third"
            title="Para cualquiera"
            description="Diseños de menú para todos"
            media={
              <CardGrid.StackedCard.Image
                src="/design_modes_light.png"
                srcset={[
                  {
                    src: "/design_modes_dark.png",
                    theme: "dark",
                  },
                ]}
                alt="Grid"
                bezelCrop={{ edge: "bottom", croppedRatio: 0.1 }}
              />
            }
            textAlignment="leading"
          />

          {/* <CardGrid.StackedCard
            maxWidth="twoThirds"
            title="Rutas? Trayectos? Paradas?"
            description="Nuestro catálogo de rutas tiene todo para facilitar tu movilidad."
            media={
              <CardGrid.StackedCard.Image
                src="/hidden_design.png"
                alt="Make sure to provide an image description for accessibility purposes"
                bezel="iPhone Air Sky Blue"
              />
            }
            textAlignment="leading"
          /> */}

          <CardGrid.StackedCard
            maxWidth="twoThirds"
            title="Catálogo de rutas"
            description="Nuestro catálogo de rutas tiene todo para facilitar tu movilidad."
            layoutDirection="reverse"
            media={
              <CardGrid.StackedCard.Image
                src="/expanded_design.png"
                alt="Make sure to provide an image description for accessibility purposes"
                bezel="iPhone Air Sky Blue"
                bezelCrop={{ edge: "bottom", croppedRatio: 0.25 }}
              />
            }
            textAlignment="leading"
          />

          {/* <CardGrid.OverlaidCard
            maxWidth="third"
            imageSrc="/app_view/overlay_image_placeholder_light.png"
            imageSrcset={[
              {
                src: "/rutas_patron.png",
                theme: "dark",
              },
            ]}
            title="Feature On An Overlay Card"
            description="These look great with photos or a custom graphics if you're willing to go the extra mile"
            textAlignment="center"
          /> */}

          <CardGrid.StackedCard
            maxWidth="full"
            title="Rutas Dinámicas"
            description="No busques más, selecciona un lugar y rutea te hará un trayecto con las rutas de transporte público necesarias, con ascensos y descensos."
            media={
              <CardGrid.StackedCard.Image
                src="/dynamic_routes.png"
                srcset={[
                  {
                    src: "/dynamic_routes.png",
                    theme: "dark",
                  },
                ]}
                alt="Grid"
                bezelCrop={{ edge: "bottom", croppedRatio: 0.1 }}
              />
            }
          />

          <CardGrid.StackedCard
            maxWidth="half"
            title="Tu actividad, en la nube"
            // titleFontStyle="cursive"
            description="Sin perder de vista la privacidad"
            media={
              <CardGrid.StackedCard.Image
                src="/profile_view.png"
                bezel="iPhone Air Sky Blue"
                bezelCrop={{ edge: "bottom", croppedRatio: 0.5 }}
                alt=""
              />
            }
            layoutDirection="reverse"
            textAlignment="center"
          />

          <CardGrid.StackedCard
            maxWidth="half"
            title="Buscador y acciones rápidas a tu alcance"
            description=""
            media={
              <CardGrid.StackedCard.Image
                src="/compact_design.png"
                bezel="iPhone Air Space Black"
                bezelCrop={{ edge: "top", croppedRatio: 0.5 }}
                alt=""
              />
            }
            layoutDirection="forward"
            textAlignment="center"
          />
        </CardGrid>
      </Section>

      {/* <Section title="What people are saying" navigationAnchor="testimonials">
        <TestimonialsGrid maxColumnCount={2}>
          <TestimonialsGrid.Testimonial
            message="Showing social proof is very important. Show some nice words about your app from social media or App Store reviews."
            authorName="Jane Doe"
            authorTitle="Person's Title"
            authorImageUrl="/app_view/profile_image_placeholder.png"
            messageFontStyle="italic"
            source="https://threads.com/some-thread-message"
          ></TestimonialsGrid.Testimonial>

          <TestimonialsGrid.Testimonial
            message="If it's an App Store review, make sure to show the stars rating, it catches attention and add visual variety."
            authorName="John Smith"
            source="appStore"
            starsRating={true}
          ></TestimonialsGrid.Testimonial>

          <TestimonialsGrid.Testimonial
            message="Include a link to the testimonial's source when possible, this makes them look more trustworthy"
            authorName="Emily Johnson"
            source="https://reddit.com/some-thread-message"
          ></TestimonialsGrid.Testimonial>

          <TestimonialsGrid.Testimonial
            message="Having person's credentials could also help build trust, especially if they are relevant to your app's domain."
            authorName="Michael Brown"
            authorTitle="CEO of Some Company"
            source="https://x.com/some-thread-message"
          ></TestimonialsGrid.Testimonial>
        </TestimonialsGrid>
      </Section> */}

      <Section title="Características Especiales">
        <CardGrid rowHeight={280}>
          <CardGrid.IconCard
            maxWidth="third"
            iconName="settings"
            title="Altamente Configurable"
            description="Rutea se pensó desde la experiencia de usuario."
          />

          <CardGrid.IconCard
            maxWidth="third"
            iconName="search"
            title="Búsqueda Personalizada"
            description="Nuestro buscador combina información ciudad - rutas. No solo lugares, filtra lugares por ruta en cada ciudad."
          />

          <CardGrid.IconCard
            maxWidth="third"
            iconName="bus_map_pin"
            title="Transporte Público"
            description="Rutea MX está lista para gestionar rastreo de vehiculos. Espéralo muy pronto."
          />
        </CardGrid>
      </Section>

      <Section 
        title="¿Dudas, sugerencias o quejas? ¡Contáctanos!"
        navigationAnchor="contact"
        paddingTop={0}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr",
            gap: 18,
            alignItems: "stretch",
            marginTop: -30,
          }}
        >
          {/* Lado izquierdo */}
          <div
          style={{
            padding: 40,
            paddingTop: 34, // ajusta este valor
            borderRadius: 36,
            background: "var(--color-background-secondary)",
            display: "flex",
            flexDirection: "column",
          }}
        >
            <span
              style={{
                color: "var(--color-accent-brand)",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Rutea MX
            </span>

            <h2
              style={{
                margin: 0,
                fontSize: 40,
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
              }}
            >
              Estamos para escucharte.
            </h2>

            <p
              style={{
                marginTop: 10,
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
              }}
            >
              Si tienes dudas, sugerencias, quieres reportar algún problema
              o colaborar con el proyecto, estaremos encantados de leerte.
            </p>

            <div
              style={{
                marginTop: "20px",
                display: "grid",
                gap: 18,
              }}
            >
              <div>
                <strong>Correo</strong>
                <br />
                xera00@icloud.com
              </div>

              <div>
                <strong>Teléfono</strong>
                <br />
                +52 (646) 272-1753
              </div>

              <div>
                <strong>Dirección</strong>
                <br />
                Calle Gardenias #118, Lomas de Valle Verde
                <br />
                Ensenada, Baja California
              </div>
            </div>
          </div>

          {/* Formulario */}

          <ContactForm />
        </div>
      </Section>

      <Section paddingTop={60} paddingBottom={160}>
        <DownloadActionButton
          size="medium"
        />
      </Section>
    </>
  );
}
