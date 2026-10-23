import {
  Request,
  Response,
} from "express";

import CentralComercialService from "../services/CentralComercialService";

import type {
  CentralComercialChannel,
  CentralComercialFilters,
  CentralComercialStage,
} from "../models/CentralComercialTypes";

const centralComercialService =
  new CentralComercialService();

type AuthenticatedRequestUser = {
  id?: string;
  usuarioId?: string;
  role?: string;
  tipo?: string;
};

function getAuthenticatedUser(
  request: Request,
): {
  userId: string;
  role: string | null;
} {
  const user =
    (request as Request & {
      user?: AuthenticatedRequestUser;
    }).user;

  const userId =
    String(
      user?.usuarioId ||
      user?.id ||
      "",
    ).trim();

  if (!userId) {
    throw new Error(
      "CENTRAL_COMERCIAL_USUARIO_NAO_AUTENTICADO",
    );
  }

  const role =
    String(
      user?.role ||
      user?.tipo ||
      "",
    ).trim() || null;

  return {
    userId,
    role,
  };
}

function optionalText(
  value: unknown,
): string | undefined {
  const normalized =
    String(value ?? "").trim();

  return normalized || undefined;
}

function optionalPositiveInteger(
  value: unknown,
): number | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  const parsed =
    Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return undefined;
  }

  return parsed;
}

function statusFromError(
  error: unknown,
): number {
  const message =
    error instanceof Error
      ? error.message
      : String(error || "");

  switch (message) {
    case "CENTRAL_COMERCIAL_USUARIO_NAO_AUTENTICADO":
      return 401;

    case "CENTRAL_COMERCIAL_ACESSO_EXCLUSIVO_PARCEIRO":
      return 403;

    case "CENTRAL_COMERCIAL_USUARIO_NAO_ENCONTRADO":
      return 404;

    case "CENTRAL_COMERCIAL_OPORTUNIDADE_OBRIGATORIA":
      return 400;

    default:
      return 500;
  }
}

function publicErrorMessage(
  error: unknown,
): string {
  const message =
    error instanceof Error
      ? error.message
      : String(error || "");

  switch (message) {
    case "CENTRAL_COMERCIAL_USUARIO_NAO_AUTENTICADO":
      return "Usuário não autenticado.";

    case "CENTRAL_COMERCIAL_ACESSO_EXCLUSIVO_PARCEIRO":
      return "A Central Comercial é exclusiva para prestadores e empreendedores.";

    case "CENTRAL_COMERCIAL_USUARIO_NAO_ENCONTRADO":
      return "Usuário autenticado não encontrado.";

    case "CENTRAL_COMERCIAL_OPORTUNIDADE_OBRIGATORIA":
      return "ID da oportunidade não informado.";

    default:
      return "Não foi possível carregar a Central Comercial.";
  }
}

export class CentralComercialController {
  /**
   * GET /central-comercial
   * GET /central-comercial/oportunidades
   *
   * A autorização é derivada exclusivamente do JWT/sessão.
   * ownerUserId/storeId enviados pelo navegador não são utilizados.
   */
  static async listar(
    request: Request,
    response: Response,
  ) {
    try {
      const auth =
        getAuthenticatedUser(
          request,
        );

      const filters: CentralComercialFilters =
        {
          stage:
            optionalText(
              request.query.stage,
            ) as
              | CentralComercialStage
              | undefined,

          channel:
            optionalText(
              request.query.channel,
            ) as
              | CentralComercialChannel
              | undefined,

          campaignId:
            optionalPositiveInteger(
              request.query.campaignId,
            ),

          search:
            optionalText(
              request.query.search,
            ),

          page:
            optionalPositiveInteger(
              request.query.page,
            ),

          limit:
            optionalPositiveInteger(
              request.query.limit,
            ),
        };

      const result =
        await centralComercialService.list(
          auth,
          filters,
        );

      return response
        .status(200)
        .json({
          success: true,
          ...result,
        });
    } catch (error) {
      console.error(
        "[CENTRAL COMERCIAL] Falha ao listar oportunidades",
        error,
      );

      return response
        .status(
          statusFromError(error),
        )
        .json({
          success: false,
          message:
            publicErrorMessage(
              error,
            ),
        });
    }
  }

  /**
   * GET /central-comercial/oportunidades/:id
   */
  static async buscarPorId(
    request: Request,
    response: Response,
  ) {
    try {
      const auth =
        getAuthenticatedUser(
          request,
        );

      const opportunityId =
        String(
          request.params.id ||
          "",
        ).trim();

      if (!opportunityId) {
        return response
          .status(400)
          .json({
            success: false,
            message:
              "ID da oportunidade não informado.",
          });
      }

      const opportunity =
        await centralComercialService.getById(
          auth,
          opportunityId,
        );

      if (!opportunity) {
        return response
          .status(404)
          .json({
            success: false,
            message:
              "Oportunidade não encontrada ou não pertence a este negócio.",
          });
      }

      return response
        .status(200)
        .json({
          success: true,
          opportunity,
        });
    } catch (error) {
      console.error(
        "[CENTRAL COMERCIAL] Falha ao buscar oportunidade",
        error,
      );

      return response
        .status(
          statusFromError(error),
        )
        .json({
          success: false,
          message:
            publicErrorMessage(
              error,
            ),
        });
    }
  }
}

export default CentralComercialController;