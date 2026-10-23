import { LayoutBaseService } from "./services/LayoutBaseService";

function test() {
  console.log("\n=== TESTE 1: PSICOPEDAGOGIA ===");

  const health = LayoutBaseService.resolveServiceBase({
    categoryName: "Psicopedagogia",
    businessSegment: "Saúde",
    businessType: "PRESTADOR",
    descricao: "Atendimento psicopedagógico para crianças e adolescentes",
  });

  console.log({
    id: health?.id,
    name: health?.name,
  });

  console.log("\n=== TESTE 2: REFORMA ===");

  const construction = LayoutBaseService.resolveServiceBase({
    categoryName: "Reformas",
    businessSegment: "Construção",
    businessType: "PRESTADOR",
    descricao: "Reforma residencial, pintura e marcenaria sob medida",
  });

  console.log({
    id: construction?.id,
    name: construction?.name,
  });

  console.log("\n=== TESTE 3: BELEZA ===");

  const beauty = LayoutBaseService.resolveServiceBase({
    categoryName: "Manicure",
    businessSegment: "Beleza",
    businessType: "PRESTADOR",
    descricao: "Manicure, pedicure, unhas em gel e atendimento domiciliar",
  });

  console.log({
    id: beauty?.id,
    name: beauty?.name,
  });

  console.log("\n=== BASES CARREGADAS ===");

  const all = LayoutBaseService.loadServiceBases();

  console.table(
    all.map((base) => ({
      id: base.id,
      name: base.name,
      segmentFamily: base.segmentFamily,
    })),
  );
}

test();