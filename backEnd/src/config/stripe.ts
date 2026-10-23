import Stripe from "stripe";

const isProd =
  process.env.NODE_ENV === "dev";

let stripe: any = null;
// =========================
// VALIDAÇÃO DA CHAVE
// =========================

if (!process.env.STRIPE_SECRET_KEY) {

  console.warn(
    "⚠️ STRIPE_SECRET_KEY não definida. Stripe desabilitado."
  );

} else {

  // =========================
  // SEGURANÇA AMBIENTE
  // =========================

  if (
    isProd &&
    process.env.STRIPE_SECRET_KEY.startsWith(
      "sk_test"
    )
  ) {

    console.error(
      "❌ Chave TESTE usada em PRODUÇÃO"
    );

  }

  if (
    !isProd &&
    process.env.STRIPE_SECRET_KEY.startsWith(
      "sk_live"
    )
  ) {

    console.warn(
      "⚠️ Chave LIVE fora de produção"
    );

  }

  // =========================
  // INIT STRIPE
  // =========================

  stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY,
    {
      apiVersion: "2026-03-25.dahlia",
    }
  );
}

export default stripe;