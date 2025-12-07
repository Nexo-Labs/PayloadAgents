import { NextAuthConfig } from "next-auth";
import keycloak from "next-auth/providers/keycloak";
import { getPayload } from "../get-payload";

export const SESSION_STRATEGY = "database" as "jwt" | "database";
export const FIELDS_USER_IS_ALLOWED_TO_CHANGE = ["name"];

// How to configure Keycloak in a containerized environment for Next.js
// https://ulasozdemir.com.tr/enterprise-level-authentication-in-a-containerized-environment-for-nextjs-13
export const authConfig: NextAuthConfig = {
  theme: { logo: "https://authjs.dev/img/logo-sm.png" },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    keycloak({
      allowDangerousEmailAccountLinking: true,
      id: "keycloak",
      clientId: process.env.AUTH_KEYCLOAK_ID,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
      // Configuración siguiendo el artículo de Ulaş Özdemir
      // URL pública para el navegador
      issuer: `${process.env.NEXT_PUBLIC_LOCAL_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KC_REALM}`,
      authorization: {
        params: {
          scope: "openid email profile",
        },
        url: `${process.env.NEXT_PUBLIC_LOCAL_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KC_REALM}/protocol/openid-connect/auth`,
      },
      token: `${process.env.NEXT_CONTAINER_KEYCLOAK_ENDPOINT}/realms/${process.env.NEXT_PUBLIC_KC_REALM}/protocol/openid-connect/token`,
      userinfo: `${process.env.NEXT_CONTAINER_KEYCLOAK_ENDPOINT}/realms/${process.env.NEXT_PUBLIC_KC_REALM}/protocol/openid-connect/userinfo`,
      jwks_endpoint: `${process.env.NEXT_CONTAINER_KEYCLOAK_ENDPOINT}/realms/${process.env.NEXT_PUBLIC_KC_REALM}/protocol/openid-connect/certs`,
      wellKnown: undefined,
      profile: async (profile) => {
        // Mapear roles de Keycloak a los valores permitidos en Payload
        // Payload solo acepta: 'super-admin' o 'user'
        const keycloakRoles = [
          ...(profile.roles ?? []),
          ...(profile.realm_access?.roles ?? []),
        ];

        // Mapear roles de Keycloak a roles de Payload
        const mappedRoles: string[] = [];
        if (
          keycloakRoles.some(
            (role) =>
              role === "admin" ||
              role === "super-admin" ||
              role.toLowerCase().includes("admin")
          )
        ) {
          mappedRoles.push("super-admin");
        }
        // Si no tiene admin, asignar 'user' por defecto
        if (mappedRoles.length === 0) {
          mappedRoles.push("user");
        }

        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          roles: mappedRoles,
        };
      },
    }),
  ],
  session: {
    strategy: SESSION_STRATEGY,
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // No intentar guardar id_token aquí porque el usuario puede no existir aún
      // Se guardará en el callback session cuando el usuario ya esté creado
      return true;
    },
    async jwt({ token, account, trigger }) {
      // Guardar id_token en el token para usarlo después
      // Con estrategia database, esto se usará para guardarlo en la BD en el callback session
      if (account?.id_token) {
        token.id_token = account.id_token;
      }

      return token;
    },
    async session({ session, token, user, trigger, newSession }) {
      // Pasar el id_token a la sesión para usarlo en el logout
      if (SESSION_STRATEGY === "jwt") {
        if (token?.id_token) {
          session.id_token = token.id_token as string;
        }
      } else if (SESSION_STRATEGY === "database") {
        // For database strategy, retrieve id_token from user record
        if (user && typeof window === "undefined") {
          try {
            const payload = await getPayload();
            const userRecord = await payload.findByID({
              collection: "users",
              id: user.id,
            });

            if (userRecord?.id_token) {
              session.id_token = userRecord.id_token as string;
            } else if (token?.id_token) {
              // Si no existe id_token en la BD pero está en el token, guardarlo
              // Esto puede pasar en el primer login cuando el usuario se acaba de crear
              try {
                await payload.update({
                  collection: "users",
                  id: user.id,
                  data: {
                    id_token: token.id_token as string,
                  } as any,
                });
                session.id_token = token.id_token as string;
                console.log("[Auth] ✅ ID token saved for logout");
              } catch (error) {
                console.error("[Auth] ❌ Error saving id_token:", error);
              }
            }
          } catch (error) {
            console.error("[Auth] Error retrieving id_token from user:", error);
          }
        }
      }

      return session;
    },
  },
};
