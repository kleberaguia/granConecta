export interface FormField {
  name: string;
  label: string;
  type: 'datetime' | 'select' | 'text' | 'file' | 'multiline' | 'toggle';
  options?: string[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const SERVICE_FORM_CONFIG: Record<string, FormField[]> = {
  barbearia: [
    { name: 'servico', label: 'O que vamos fazer?', type: 'select', options: ['Corte Degradê', 'Corte Clássico', 'Barba Terapia', 'Combo (Cabelo + Barba)', 'Sobrancelha'], fullWidth: true },
    { name: 'data', label: 'Sugestão de Data e Horário', type: 'datetime', fullWidth: true },
  ],

  cabelo: [
    { name: 'servico', label: 'Serviço', type: 'select', options: ['Corte', 'Escova', 'Coloração/Luzes', 'Hidratação', 'Penteado'], fullWidth: true },
    { name: 'quimica', label: 'Possui química recente no cabelo?', type: 'select', options: ['Sim', 'Não'] },
    { name: 'data', label: 'Horário desejado', type: 'datetime', fullWidth: true },
  ],

  'manicure-e-pedicure': [
    { name: 'tipo', label: 'Escolha o serviço', type: 'select', options: ['Mão', 'Pé', 'Pé e Mão', 'Unhas em Gel/Fibra'], fullWidth: true },
    { name: 'esmalte', label: 'Levará o próprio esmalte?', type: 'select', options: ['Sim', 'Não'] },
  ],

  'estetica-facial': [
    { name: 'procedimento', label: 'Procedimento', type: 'select', options: ['Limpeza de Pele', 'Peeling', 'Drenagem Facial', 'Design de Sobrancelha'], fullWidth: true },
    { name: 'sensibilidade', label: 'Possui alergia ou sensibilidade?', type: 'text', placeholder: 'Ex: Ácidos, iodo...' },
  ],

  maquiagem: [
    { name: 'evento', label: 'Tipo de Evento', type: 'select', options: ['Social/Festa', 'Noiva/Madrinha', 'Ensaio Fotográfico', 'Maquiagem Dia'], fullWidth: true },
    { name: 'local', label: 'Onde será o atendimento?', type: 'select', options: ['Meu Apartamento', 'No Estúdio do Profissional'] },
  ],

  pedreiro: [
    { name: 'urgencia', label: 'Nível de Urgência', type: 'select', options: ['Urgente (Emergência)', 'Para esta semana', 'Apenas Orçamento'] },
    { name: 'tipo_obra', label: 'O que será feito?', type: 'select', options: ['Pequeno Reparo', 'Alvenaria/Paredes', 'Piso/Revestimento', 'Pintura', 'Reforma Completa'], fullWidth: true },
    { name: 'fotos', label: 'Fotos do local (ajuda no orçamento)', type: 'file' },
  ],

  eletricista: [
    { name: 'problema', label: 'Qual o problema?', type: 'select', options: ['Chuveiro não esquenta', 'Curto Circuito', 'Instalação de Luminária', 'Troca de Tomadas', 'Quadro de Energia'], fullWidth: true },
    { name: 'urgencia', label: 'Está sem energia agora?', type: 'select', options: ['Sim, Urgente!', 'Não, é manutenção'] },
  ],

  encanador: [
    { name: 'tipo', label: 'Local do Problema', type: 'select', options: ['Pia da Cozinha', 'Vaso Sanitário', 'Chuveiro/Ducha', 'Vazamento Interno', 'Caixa d\'água'], fullWidth: true },
    { name: 'gravidade', label: 'Está inundando o local?', type: 'select', options: ['Sim', 'Não, apenas gotejamento'] },
  ],

  'manutencao-de-ar-condicionado': [
    { name: 'servico', label: 'Tipo de Serviço', type: 'select', options: ['Limpeza Preventiva', 'Instalação', 'Carga de Gás', 'Conserto (Não liga/Não gela)'], fullWidth: true },
    { name: 'btus', label: 'Potência (BTUs)', type: 'select', options: ['7.000 a 9.000', '12.000', '18.000 ou +', 'Não sei'] },
  ],

  'fretes-e-mudancas': [
    { name: 'tipo_carga', label: 'O que será transportado?', type: 'select', options: ['Mudança Residencial Completa', 'Apenas Itens Grandes (Sofá/Geladeira)', 'Pequenos volumes'], fullWidth: true },
    { name: 'ajudante', label: 'Precisa de ajudante para carregar?', type: 'select', options: ['Sim, 1 ajudante', 'Sim, 2 ou + ajudantes', 'Não preciso'] },
  ],

  psicologia: [
    { name: 'formato', label: 'Formato da Sessão', type: 'select', options: ['Online (Vídeo)', 'Presencial (Consultório)'] },
    { name: 'tipo', label: 'Público', type: 'select', options: ['Individual Adulto', 'Infantil/Adolescente', 'Casal'] },
  ],

  'aulas-particulares': [
    { name: 'materia', label: 'Disciplina/Área', type: 'text', placeholder: 'Ex: Matemática, Inglês, Violão...' },
    { name: 'nivel', label: 'Nível do Aluno', type: 'select', options: ['Fundamental', 'Médio', 'Superior', 'Hobby'] },
  ],

  'passeador-de-pets': [
    { name: 'porte', label: 'Porte do Pet', type: 'select', options: ['Pequeno', 'Médio', 'Grande', 'Gigante'] },
    { name: 'tempo', label: 'Duração do passeio', type: 'select', options: ['30 min', '1 hora', 'Pacote mensal'] },
  ],

  'banho-e-tosa': [
    { name: 'servico', label: 'Serviço', type: 'select', options: ['Banho', 'Tosa Higiênica', 'Tosa Completa', 'Corte de Unha/Ouvido'] },
    { name: 'levar_trazer', label: 'Precisa que busque o Pet?', type: 'select', options: ['Sim (Taxi Pet)', 'Não, eu levo'] },
  ],

  'oficina-mecanica': [
    { name: 'veiculo', label: 'Marca e Modelo do Carro', type: 'text' },
    { name: 'servico', label: 'Sintoma/Serviço', type: 'select', options: ['Revisão Geral', 'Barulho na suspensão', 'Problema no Motor', 'Freios', 'Elétrica Automotiva'], fullWidth: true },
  ],

  diarista: [
    { name: 'tipo_limpeza', label: 'Tipo de Limpeza', type: 'select', options: ['Limpeza de Rotina', 'Limpeza Pesada (Faxinão)', 'Pós-Obra', 'Passar Roupa apenas'], fullWidth: true },
    { name: 'tamanho', label: 'Tamanho do Imóvel', type: 'select', options: ['Kitnet/1 Quarto', '2 Quartos', '3 Quartos ou +'] },
  ],

  padeiro: [
    { name: 'pedido', label: 'Tipo de encomenda', type: 'select', options: ['Pães Artesanais (Levain)', 'Cesta de Café da Manhã', 'Salgados para Festa', 'Bolos'], fullWidth: true },
    { name: 'entrega', label: 'Data da Entrega', type: 'datetime' },
  ],

  default: [
    { name: 'detalhes', label: 'Detalhes Adicionais', type: 'multiline', placeholder: 'Descreva aqui o que você precisa especificamente...' }
  ]
};