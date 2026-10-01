import React, { useState, useEffect } from "react";
import {
  Heart,
  UserCheck,
  ListChecks,
  PhoneCall,
  UserPlus,
  ShieldAlert,
  Users,
  CalendarClock,
  Home,
  TrendingUp,
  Bus,
  PenLine,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  User,
  RotateCcw,
  Sun,
  Moon,
  Award,
  Bookmark,
  BookOpen,
  Flame,
  Lock,
  Unlock,
  Check,
  Trophy,
  HelpCircle,
  Shield,
  Compass,
  Play
} from "lucide-react";
import BibleReader from "./BibleReader";



// DADOS DO MANUAL REAL DE 2026 DO GRUPO DE AMIGOS (GA) EXTRAÍDO DAS IMAGENS
const LICOES = [
  {
    cap: 1, titulo: "Propósitos dos Grupos de Amigos", icone: "heart",
    texto: "Amar as pessoas como Jesus amou: o Amor traz o Reino de Deus à terra, por isso é o maior mandamento. O Amor é dar a vida. Dos seis \"ES\" da igreja (Evangelizar, Ensinar, Enturmar, Engrenar, Engrandecer, Espalhar), os GA's têm a função principal de Enturmar. Das atividades da igreja (Atos 2:42), os grupos encaixam-se na comunhão, no partir do pão e na oração.",
    pontos: [
      "Promover intimidade entre os membros e com Cristo.",
      "Entrosar novos convertidos e novos membros da Igreja.",
      "Incentivar assiduidade na Igreja. (Heb. 10:25)",
      "Ser o contexto onde o \"amor em ação\" é praticado. É a real igreja do membro. Primeira frente para suprir as necessidades dos irmãos.",
      "Oferecer amizade e o sentimento de pertencer. Ser um local de oração."
    ],
    ref: "1 João 3:16 • Atos 2:42 • Hebreus 10:25",
    alerta: "Nosso papel não é mudar ninguém, isto é função do Espírito Santo. Nós só podemos incentivar. O Espírito Santo é que transforma e as mudanças ocorrem. (ex: cabelo, brinco, etc.)"
  },
  {
    cap: 2, titulo: "Quem pode ser líder — Não recém-convertido e Irrepreensível", icone: "user-check",
    texto: "1 Timóteo 3 — Quem pode ser líder? O que precisa ter ou ser? NÃO pode ser recém-convertido.",
    pontos: [
      "Uma pessoa maior de idade, a partir de 19 anos, responsável, adulto espiritual e constante nas reuniões da igreja, inclusive no próprio grupo. O líder não pode faltar sem comunicar.",
      "Alguém que ama a Deus, que tem um relacionamento vivo com Ele e não somente um servo eficiente.",
      "\"Veste a camisa\" de sua igreja, atuando em ministérios, contribuindo com ofertas, etc.",
      "Para que não se ensoberbeça.",
      "Devem ser primeiro testados e observados, além de não possuírem nada contra eles.",
      "Irrepreensível: \"Que ninguém possa culpar de nada\" (NTLH). \"Contra cuja vida não se possa falar nada\" (VIVA).",
      "O líder de GA está ciente que pode ser disciplinado publicamente ou em particular, conforme a orientação bíblica dada ao pastorado, caso venha a pecar de forma que necessite de disciplina.",
      "Usar a internet é plantar coisas para o futuro: o que você plantar, isso vai colher. Cuidado com as conversas, devem ser santas.",
      "Cuidado com as conversas, curtidas, marcações, postagens e repostagens; tudo deve ser agradável a Deus. Qual o propósito de suas postagens? Tome cuidado com ideologias."
    ],
    ref: "1 Timóteo 3"
  },
  {
    cap: 3, titulo: "Boa reputação, Consciência limpa e Apto para ensinar", icone: "user-check",
    texto: "Deve ter boa reputação perante os de fora.",
    pontos: [
      "Padrão de crescimento espiritual constante.",
      "Meditação e oração constantes e organizadas. (Autótrofo) — Busca intimidade diária com Deus.",
      "Geralmente possuir no mínimo um a dois anos de fidelidade cristã na Igreja local. Analisar cada caso com acompanhamento pastoral.",
      "Consciência limpa: ter no mínimo 2 anos de pureza moral e sexual. Afinidade com a liderança da igreja.",
      "Não esconda o seu passado, cuidado, o Senhor irá revelar.",
      "Apto para ensinar: desejo de ver outras pessoas conhecerem a Cristo e se entrosarem na igreja.",
      "Coragem para exortar pela PALAVRA em AMOR quando for necessário.",
      "Participação ativa no SISTEMA DE ENSINO de sua igreja. (SENIB)"
    ],
    ref: "1 Timóteo 3"
  },
  {
    cap: 4, titulo: "Demais características do líder", icone: "list-checks",
    texto: "Respeitável: uma pessoa que sabe aconselhar sob a luz das escrituras.",
    pontos: [
      "Todo líder precisa se apresentar ao pastor de jovens e à sua esposa, no caso das mulheres quando estiver assumindo um GA. O líder anterior precisa ter certeza que isso foi feito.",
      "Ter um bom relacionamento em todos os ambientes que frequenta: trabalho; escola/faculdade; família; círculo de amigos; vizinhança e etc.",
      "Hospitaleiro: dom de hospitalidade e de arrebanhar novas pessoas. Esforço para conhecer pessoas novas e fazer novas amizades.",
      "Marido de uma só mulher (santidade sexual).",
      "Sóbrio — não deve ser apegado ao vinho.",
      "Prudente.",
      "NÃO violento, mas sim amável e pacífico.",
      "NÃO apegado ao dinheiro.",
      "Deve governar bem sua própria família.",
      "Dignos: as mulheres igualmente sejam dignas, não caluniadoras, mas sóbrias e confiáveis em tudo.",
      "Não obter lucros desonestos.",
      "Homens de palavra: querer um ministério de muita responsabilidade, que requer tempo e dedicação. Querer \"pastorear\" um pequeno rebanho.",
      "Não pode deixar de ter reunião de GA sem um bom motivo, sem avisar; para isso que você tem orientação.",
      "Caso necessite se ausentar, deve preparar tudo com antecedência, escolhendo o seu representante e informando ao pastor responsável com pelo menos uma semana de antecedência."
    ],
    ref: "1 Timóteo 3",
    alerta: "Antes de apresentar um treinando para o CURSO DE TREINAMENTO DE NOVOS LÍDERES, leia TODOS OS REQUISITOS ACIMA, leia 1 Timóteo 3, e se passar nas peneiras, antes de convidar, pergunte com firmeza se há algo escondido em sua vida, dando-lhe a oportunidade de confessar. Verifique principalmente: imoralidade sexual, especialmente homossexualismo, desonestidade e má reputação. TREINANDOS DEVEM SER APROVADOS PELO PASTOR DE JOVENS E/OU POR UM ORIENTADOR PARA PARTICIPAREM DO TREINAMENTO."
  },
  {
    cap: 5, titulo: "Responsabilidades do líder", icone: "list-checks",
    texto: "",
    pontos: [
      "Liderar reunião semanal seguindo o roteiro proposto, ou algo por ele planejado caso não haja roteiro pré-estabelecido, começando na hora combinada (não esperar atrasados — comece com quem estiver e ensine que os outros devem chegar calados e esperar as instruções).",
      "Prover um local agradável para as reuniões.",
      "Dirigir e controlar a reunião. Manter a dinâmica do grupo. Encorajar ou vetar atividades ou comportamentos não alinhados aos objetivos. Controlar quem fala muito ou fala coisas irrelevantes.",
      "Lembrar periodicamente os objetivos do grupo.",
      "Informar aos participantes da necessidade de multiplicar caso o número de pessoas cresça muito.",
      "Saber quem faltou o grupo e o porquê. Manter contato com membros ausentes na tentativa de resgatá-los, incentivando os outros participantes a ligar também. Uma ligação tem muito poder.",
      "Lembrar-se da data do aniversário de cada membro.",
      "Tomar cuidado com os agrupamentos indevidos de pessoas muito parecidas (com os mesmos problemas e afinidades).",
      "Saiba o ministério que seu liderado faz parte e passe informações relevantes para os líderes de ministério sobre eles. Em conjunto podemos ensinar mais e melhor!",
      "Informar as ocorrências significativas do seu GA ao pastor/orientador responsável.",
      "GA dos Jovens: ficar atento às ações dos liderados nas redes sociais; representar o pastor quando necessário; conhecer os pais dos membros; informar-se com o pastor de jovens sobre a idade de transição.",
      "As janelas de transição (J1 para J2; ou J2 para o MIX) ocorrem após o musical e após o Sonho de Natal, sempre orientadas pelo Pastor de Jovens."
    ],
    ref: null
  },
  {
    cap: 6, titulo: "Responsabilidades (continuação) e Dicas", icone: "list-checks",
    texto: "",
    pontos: [
      "Havendo alterações importantes no comportamento de um liderado, primeiro converse com ele. Caso não haja mudança, informe ao pastor/orientador responsável.",
      "Procurar as ovelhas durante os eventos evangelísticos da igreja, pois nessas épocas elas se dispersam.",
      "Manter o seu cadastro (APP, WhatsApp, SENIB, etc.) atualizado para contato rápido em urgências.",
      "Participar das reuniões e treinamentos de liderança. Se não for possível, avisar e enviar representante ou pegar o material.",
      "Treinar novos líderes, escolhendo-os de forma criteriosa: não pela amizade, não só pelo talento, mas por ver de fato uma pessoa que ama a Deus e está melhorando a cada dia.",
      "Treinandos — jovens a partir de 19 anos, que poderão assumir um GA em até seis meses.",
      "Ser comprometido a buscar novos membros nos cursos de Um Com Deus e cultos.",
      "Manter cuidado com suas redes sociais. \"Os outros podem, nós não podemos\".",
      "Manter os pastores informados do que acontece no grupo e não faltar aos cultos e SENIB.",
      "Manter cuidado especial no uso de ferramentas de comunicação como grupos de WhatsApp.",
      "Dica: caso possa perder o controle, faça grupos com permissão de envio para Somente Administradores.",
      "Dica: não permita nada além das coisas relacionadas ao grupo. Seja chato em relação a informação irrelevante, imoral, política, etc.",
      "Dica: manter-se fiel à visão da igreja local e comunicar suas dúvidas e decisões aos pastores antes dos liderados.",
      "Dica: assim como um líder é convidado para assumir a liderança, o mesmo pode ser desconvidado, caso o pastorado creia que isso é o melhor para a igreja.",
      "Dica: consultar regularmente este manual de liderança para ter certeza de que está aplicando corretamente as diretrizes."
    ],
    ref: null
  },
  {
    cap: 7, titulo: "Visitantes e Mudança de grupo", icone: "user-plus",
    texto: "Visitantes são bem-vindos, mas só devem ser considerados pertencentes ao grupo após entrevista com um Pastor (se vierem de outras igrejas). Devem vir primeiro aos cultos e depois aos Grupos de Amigos — mas pode haver exceções. Cuidado para não passar batido!",
    pontos: [
      "Evite os \"enrolados\", mais novos, mais velhos (temos idade limite), imorais, etc. Se tiver suspeita, procure logo saber o que está acontecendo. Use o BOM SENSO. Não chame qualquer um para o grupo.",
      "A \"Visitação\" ao GA deve ter limite, para a pessoa não manter um vínculo mesmo estando com a vida irregular.",
      "Atenção quando os visitantes estiverem \"contando a semana\": administre o que não é saudável expor a todos.",
      "Mudança de grupo: se um membro quer mudar, não há problema, desde que os dois líderes acertem tudo.",
      "Ao receber alguém de outro grupo, pergunte: já conversei com o líder anterior? Ele saiu isento de: 1) pecado sexual; 2) falta de submissão, rebeldia; 3) descompromisso com o grupo ou a igreja; 4) mais de uma mudança de grupo?",
      "Se não houver problema nesses pontos pode ser aceito; caso contrário, consultar o pastor. Cuidado com pessoas trocando de grupo: peuvent ser lobos querendo aproveitar-se ou rebeldes."
    ],
    ref: null
  },
  {
    cap: 8, titulo: "Imoralidade, Relacionamentos e Passado sujo", icone: "shield-alert", acento: "ambar",
    texto: "Imoralidade é ato ou tentativa de pecado sexual com membros da igreja ou não, assim como homossexualismo, pedofilia, prostituição, pornografia, adultério, etc. O que fazer? Após certificar-se do fato por confissão ou outro meio lícito, comunicar imediatamente ao pastor.",
    pontos: [
      "Evite prometer que não vai falar a ninguém; diga algo assim: \"pode confiar que farei o melhor para você\".",
      "Caso a pessoa não queira falar, tome providências para que ela não contamine os outros e informe ao pastor imediatamente. Siga fielmente as recomendações pastorais.",
      "Quando temos crianças espirituais, temos \"problemas de crianças\". O grupo mais maduro não deve escandalizar-se e sempre deve ajudar.",
      "Cuidado com seus relacionamentos e dos liderados, inclusive entre jovens do mesmo sexo.",
      "Líderes são muito tentados no namoro; faça decisões radicais. Não pode dormir na casa um do outro.",
      "Cuidado com relacionamentos virtuais. Evite envolvimento corporal e afetivo inadequados.",
      "Passado sujo não deve ser exposto ao grupo nem debatido nele. A pessoa deve ser encaminhada a aconselhamento especializado."
    ],
    ref: "1 Co. 6:18 • Ef. 5:23"
  },
  {
    cap: 9, titulo: "Doentes, Conflito de horários, Reuniões, Programações e Créditos", icone: "calendar-clock",
    texto: "",
    pontos: [
      "Membros doentes ou viajando: o líder deve prestar assistência — enviar meditações, fazer ligações e incentivar a memorização de versículos. Pode-se fazer uma escala para todos participarem.",
      "Conflito de horários com o ministério: líderes devem ter bom senso e decidir o melhor para o liderado. Quem está no ministério não está ocioso. Se o membro não consegue frequentar o grupo por mais de quatro semanas, deve mudar para um grupo em horário adequado. Na dúvida, procure o pastor.",
      "Reuniões divertidas e criativas: não devem ser chatas; diversifique e mantenha o grupo interessante e interessado. O roteiro ajuda a fazer uma reunião dinâmica.",
      "Programações extras: juntou dois ou mais da igreja, é uma programação da igreja! Avise sobre festas, reuniões, futebol, etc.",
      "Qualquer atividade extra que envolva os GA's dos Jovens, mesmo com poucos participantes, deve ser do conhecimento e aprovada pelo pastor responsável.",
      "Pelo menos uma vez por ano faça uma programação especial (ideal no fim do ano). Faça reconhecimento do local antes. A questão financeira é muito importante.",
      "Sistema de créditos: liderança é creditar carinho, dedicação e amor para depois cobrar. Cobrança sem crédito não pode existir. Uma pessoa segue quem se importa com ela."
    ],
    ref: null
  },
  {
    cap: 10, titulo: "Ausência, Salas, Novos líderes, Amigo Líder e o Pastor", icone: "home",
    texto: "Ausência no grupo: USE SEMPRE O BOM SENSO. Trabalho/escola: incentive a troca de grupo. Viagem/doença/fator temporário: continua no grupo. Falta de compromisso, ausência total ou imoralidade: procure a pessoa e confronte-a biblicamente; sem mudança, após quatro semanas de ausência, desligue-a do grupo e avise o pastor.",
    pontos: [
      "Uso de salas: não use as salas da igreja para aniversários. Após usar, deixe mais limpa e organizada do que estava, fotografe e envie ao responsável. Não tire nada da sala sem permissão.",
      "Novos líderes: um líder nasce trabalhando — dê oportunidades, incentive e treine auxiliares. Ninguém é treinando sem aprovação do Orientador de GA e do Pastor de jovens. Nunca prometa que a pessoa vai ser líder!",
      "Peça aos novos líderes que passem seus dados de contato ao pastor responsável e registre-os na Coordenação de GA.",
      "Treine seu Josué e Calebe dentro do seu grupo; dê credibilidade às pessoas do seu lado.",
      "Amigo Líder — Amigo de verdade: todo líder precisa ser acompanhado e cobrado por alguém que saiba de suas tentações. Cada líder é responsável por sua própria vida diante de Deus.",
      "Rifas, cotas, ofertas e camisas: nunca recolha ofertas sem autorização pastoral; nunca faça rifas, bingos, feijoadas ou aniversário beneficente. Confecção de camisa precisa de aprovação pastoral COM ANTECEDÊNCIA.",
      "Quem é o pastor: o líder não é o chefe nem o pastor principal do liderado — é um irmão mais velho. Não assuma com VOZ pastoral o disciplinar, perdoar ou corrigir. O líder não faz disciplina; isso é exclusivo do pastor de jovens."
    ],
    ref: null
  },
  {
    cap: 11, titulo: "Comunhão, Lanche, Crescimento e Roteiro", icone: "trending-up",
    texto: "Dicas para gerar comunhão e cuidar do grupo no dia a dia.",
    pontos: [
      "Incentive os membros a entrarem em contato uns com os outros durante a semana.",
      "Grupos em redes sociais (WhatsApp) devem ter controle absoluto do líder, sem virar perda de tempo.",
      "Lembrem-se dos aniversários, façam surpresas e saídas especiais (sem se esquecer de equilibrar).",
      "Faça uma lista com nomes, aniversários e linguagem de amor de cada um, com cópia para todos.",
      "Promova atividades de comunhão — sugestão: pelo menos uma atividade externa a cada dois meses. Amem uns aos outros de verdade. Invista no reino, seja o primeiro!",
      "Hora do lanche: divida com todos, sem sobrecarregar ninguém; merenda prática e simples. Faça o NADA ACONTECEU (limpeza e arrumação) após as reuniões. Não lave louças na pia do banheiro nem deixe restos de comida.",
      "Crescimento e multiplicação: se o grupo estiver muito grande, MULTIPLICA-SE para crescer e manter intimidade, preparando o novo líder desde cedo.",
      "Comunique alterações permanentes de dia, hora ou local aos responsáveis. O grupo deve estar sempre aberto a novas pessoas.",
      "Grupos com menos de 8 pessoas devem crescer logo ou, após 2 meses, serão aglutinados em outros.",
      "Roteiro: entregue periodicamente; siga ao máximo. Pode ser adaptado para programações especiais — na dúvida, procure o pastor."
    ],
    ref: null
  },
  {
    cap: 12, titulo: "Recomendações para saídas, festas e eventos", icone: "bus", acento: "ambar",
    texto: "Diretrizes gerais para saídas, festas e eventos:",
    pontos: [
      "1. Deve haver aprovação pastoral antecipada. Guarde o e-mail ou mensagem de aprovação.",
      "2. Não devem correr acima de 80km/h na estrada. Não pode ser para Figueiredo. Cuidado extremo na ultrapassagem e com manobras perigosas. Prudência!",
      "3. Todos devem permanecer sempre juntos.",
      "4. Evitar brincadeiras perigosas.",
      "5. Cuidado extremo contra afogamentos.",
      "6. Não voltar tarde, não deixar se empolgar demais e perder a hora.",
      "7. Todos devem ter carona para ir e voltar, ou transporte público em caso de programação na cidade.",
      "8. Nenhum compromisso com ministério, igreja ou casa deve ser prejudicado.",
      "9. Pelo menos um líder para cada 10 jovens se houver piscina ou igarapé. Quem desobedecer fica fora da água.",
      "10. À noite não pode terminar depois das 22h (ou outro horário aprovado pelo Pastor de Jovens). Quem estiver de ônibus deve sair até as 21h. Mulheres evitem ir de saia em ônibus e sozinhas para a parada.",
      "11. Cuidado para não ser uma programação cara; deve ser acessível a todos. Cuidado com a cota da comida para não dar mau testemunho.",
      "12. Não poderá dormir junto, a não ser com aprovação pastoral prévia.",
      "13. Não deve haver dança. Sejam criativos. (Social, se houver presença de um pastor da igreja.)",
      "14. Se houver descrentes, precisa avisar ao pastor. Não pode haver álcool em nenhuma atividade (evite isso em casamentos também).",
      "15. Não permitam convidados sem aprovação pastoral. Não passe do número proposto. Na dúvida, pergunte.",
      "16. Para cada 20 pessoas deve haver pelo menos um casal de líderes casados, de preferência do Nova Jovens.",
      "17. Pense e repense: que tudo seja para a Glória de Deus e que o nome da igreja de Jesus não seja prejudicado.",
      "18. Cuidado em postagens em redes sociais; muitas pessoas não entendem. Seja sábio.",
      "19. Nada de músicas seculares; traga sempre o céu às suas reuniões. \"Por último, meus irmãos, encham a mente de vocês com tudo o que é bom e merece elogios, isto é, tudo o que é verdadeiro, digno, correto, puro, agradável e decente.\" (Fp 4:8, NTLH)",
      "20. Sempre faça as coisas com um propósito; até as programações precisam glorificar ao Senhor.",
      "21. Chá de lingerie não é autorizado para jovens que irão casar; pode-se fazer um chá de bênçãos, sem lingeries e sem assuntos impróprios.",
      "22. Festas do pijama não são autorizadas para homens. Para mulheres, somente após responder e ser autorizada: Alguém tem problemas de imoralidade sexual? Há menores de idade — os pais sabem e autorizam? Vai gerar conflito com outras atividades da igreja? Todos terão onde dormir? De quem é a casa e foi autorizada pelos donos? Quantas pessoas participariam? Recomendação: o líder é sempre o último a dormir."
    ],
    ref: "Filipenses 4:8"
  },
  {
    cap: 13, titulo: "Compromisso do líder", icone: "pen-line", compromisso: true,
    texto: "Este manual é o seu compromisso de liderança. Aceitar a função/chamado é concordar e cumprir com tudo o que está escrito.",
    pontos: [
      "Ao assinar, você declara ter lido o manual e se compromete a cumpri-lo sob a orientação do pastor de jovens."
    ],
    ref: null
  }
];



export default function TrilhaFormacao({ onConcluir }) {
  // Local-first persistent state initialization
  const [passo, setPasso] = useState(() => {
    const saved = localStorage.getItem("ga_trilha_passo");
    return saved !== null ? Number(saved) : 0;
  });

  const totalPassos = LICOES.length;
  const licaoAtiva = LICOES[passo] || LICOES[0];
  const isFinalStep = passo === totalPassos - 1;
  const isAmber = licaoAtiva?.acento === "ambar";

  const [nome, setNome] = useState(() => {
    return localStorage.getItem("ga_trilha_nome") || "";
  });

  const [data, setData] = useState(() => {
    return localStorage.getItem("ga_trilha_data") || new Date().toISOString().substring(0, 10);
  });

  const [concluido, setConcluido] = useState(() => {
    return localStorage.getItem("ga_trilha_concluido") === "true";
  });

  // Bible Integration States
  const [isBibleOpen, setIsBibleOpen] = useState(false);
  const [bibleReference, setBibleReference] = useState(null);


  // Dark mode integration
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("ga_theme");
    if (saved) return saved === "dark";
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Apply dark class to document body/root element dynamically for standard Tailwind dark styling
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("ga_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("ga_theme", "light");
    }
  }, [darkMode]);

  // Sync state values with localStorage
  useEffect(() => {
    localStorage.setItem("ga_trilha_passo", passo.toString());
  }, [passo]);

  useEffect(() => {
    localStorage.setItem("ga_trilha_nome", nome);
  }, [nome]);

  useEffect(() => {
    localStorage.setItem("ga_trilha_data", data);
  }, [data]);

  // Navigation handlers
  const handleNext = () => {
    if (passo < totalPassos - 1) {
      setPasso(passo + 1);
    }
  };

  const handleBack = () => {
    if (passo > 0) {
      setPasso(passo - 1);
    }
  };

  const handleConcluirTrilha = (e) => {
    e.preventDefault();
    if (nome.trim() && data) {
      const dados = { nome, data };
      localStorage.setItem("ga_trilha_concluido", "true");
      setConcluido(true);
      if (onConcluir) {
        onConcluir(dados);
      }
    }
  };

  const handleReiniciar = () => {
    if (confirm("Tem certeza que deseja reiniciar o seu progresso de leitura?")) {
      localStorage.removeItem("ga_trilha_passo");
      localStorage.removeItem("ga_trilha_concluido");
      localStorage.removeItem("ga_trilha_nome");
      localStorage.removeItem("ga_trilha_data");

      setPasso(0);
      setNome("");
      setData(new Date().toISOString().substring(0, 10));
      setConcluido(false);
    }
  };

  // Helper to render responsive Lucide Icons
  const renderLicaoIcon = (iconName, isAmberTheme) => {
    const baseClass = "w-6 h-6 " + (isAmberTheme ? "text-amber-700 dark:text-amber-400" : "text-teal-700 dark:text-teal-400");
    switch (iconName) {
      case "heart":
        return <Heart className={baseClass} />;
      case "user-check":
        return <UserCheck className={baseClass} />;
      case "list-checks":
        return <ListChecks className={baseClass} />;
      case "phone-call":
        return <PhoneCall className={baseClass} />;
      case "user-plus":
        return <UserPlus className={baseClass} />;
      case "shield-alert":
        return <ShieldAlert className={baseClass} />;
      case "users":
        return <Users className={baseClass} />;
      case "calendar-clock":
        return <CalendarClock className={baseClass} />;
      case "home":
        return <Home className={baseClass} />;
      case "trending-up":
        return <TrendingUp className={baseClass} />;
      case "bus":
        return <Bus className={baseClass} />;
      case "pen-line":
        return <PenLine className={baseClass} />;
      default:
        return <Heart className={baseClass} />;
    }
  };

  return (
    <div className="relative w-full text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* OVERLAY DA BÍBLIA SAGRADA */}
      {isBibleOpen && (
        <BibleReader
          onClose={() => {
            setIsBibleOpen(false);
            setBibleReference(null);
          }}
          initialReference={bibleReference}
        />
      )}

      {/* COMPONENTE INTERNO */}
      <main className="flex-1 px-5 py-5 flex flex-col justify-between overflow-y-auto no-scrollbar">
        {concluido ? (
          /* TELA DE CONCLUÍDO (ESTADO FINAL) */
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-teal-950/40 rounded-full flex items-center justify-center mb-6 relative border border-emerald-200/40">
              <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-950/20 rounded-full animate-ping opacity-30"></div>
              <Sparkles className="w-8 h-8 text-teal-700 dark:text-teal-400" />
            </div>

            <div className="px-4 py-1.5 bg-teal-50 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300 border border-teal-100 dark:border-teal-900 rounded-full text-[10px] font-bold tracking-wider uppercase mb-3">
              Certificação de Liderança
            </div>

            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Trilha Concluída!
            </h2>
            <div className="text-xs italic text-teal-600 dark:text-teal-400 font-medium mb-3">
              ✝ Firme na Palavra e no Amor
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6 leading-relaxed">
              Você concluiu com sucesso todos os {totalPassos} capítulos do Manual de Formação de Líderes do GA!
            </p>

            {/* BOX DE CONFIRMAÇÃO DO COMPROMISSO */}
            <div className="w-full bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-left mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-3.5 flex items-center gap-1.5 underline underline-offset-2">
                <User className="w-3.5 h-3.5" />
                Compromisso Homologado
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="text-[9px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider font-bold font-sans">
                    Líder Declarado
                  </div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {nome}
                  </div>
                </div>
                
                <div className="h-[0.5px] bg-slate-100 dark:bg-[#2e2e2e]" />
                
                <div>
                  <div className="text-[9px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider font-bold font-sans">
                    Data da Assinatura
                  </div>
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {new Date(data + "T12:00:00").toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* FLUXO NORMAL DA TRILHA */
          <div className="flex-1 flex flex-col justify-between animate-fadeIn">
            {/* PROGRESS HEADER - HIGH DENSITY STYLE */}
            <div className="mb-5">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-teal-700 dark:text-teal-400 italic underline underline-offset-4">
                  CONTEÚDO DO MANUAL &middot; {licaoAtiva.titulo}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBibleReference(null);
                      setIsBibleOpen(true);
                    }}
                    className="p-1 text-teal-700 dark:text-teal-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 rounded transition flex items-center justify-center cursor-pointer"
                    title="Bíblia Sagrada"
                    aria-label="Bíblia Sagrada"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleReiniciar}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-zinc-800/60 rounded transition flex items-center justify-center cursor-pointer"
                    title="Reiniciar Curso"
                    aria-label="Reiniciar Curso"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <span className="ml-1">{passo + 1} / {totalPassos}</span>
                </span>
              </div>
              <div className="w-full h-1 bg-slate-200 dark:bg-slate-700/80 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isAmber ? "bg-amber-500" : "bg-teal-700 dark:bg-teal-500"
                  }`}
                  style={{ width: `${((passo + 1) / totalPassos) * 100}%` }}
                />
              </div>
            </div>

            {/* CARD PRINCIPAL (CONTEÚDO DA LIÇÃO) */}
            <div className="bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex-1 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                {/* Chapter Title & Indicator Accent */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border ${
                      isAmber
                        ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100"
                        : "bg-[#E1F5EE] dark:bg-teal-950/40 text-teal-800 dark:text-teal-400 border-teal-100/40"
                    }`}
                  >
                    {renderLicaoIcon(licaoAtiva.icone, isAmber)}
                  </div>
                  <div>
                    <div
                      className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider mb-0.5 ${
                        isAmber
                          ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                          : "bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300"
                      }`}
                    >
                      Capítulo {licaoAtiva.cap}
                    </div>
                    <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white leading-snug">
                      {licaoAtiva.titulo}
                    </h2>
                  </div>
                </div>

                {/* TEXTO RESUMO */}
                {licaoAtiva.texto && (
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {licaoAtiva.texto}
                  </p>
                )}

                {/* PONTOS CHAVE DA LIÇÃO - SQUARED BULLETS FROM THEME */}
                <div className="bg-slate-50 dark:bg-slate-800/35 border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <h3 className="text-[9px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-widest font-sans">
                    Diretrizes Fundamentais
                  </h3>
                  <ul className="space-y-2.5">
                    {licaoAtiva.pontos.map((ponto, i) => (
                      <li key={i} className="flex gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-normal">
                        <div
                          className={`w-4 h-4 flex-shrink-0 bg-white dark:bg-[#1e1e1e] border rounded flex items-center justify-center mt-0.5 ${
                            isAmber
                              ? "border-amber-200 dark:border-amber-800"
                              : "border-teal-200 dark:border-teal-800"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAmber ? "bg-amber-600 dark:bg-amber-400" : "bg-teal-600 dark:bg-teal-400"
                            }`}
                          />
                        </div>
                        <span className="flex-1">{ponto}</span>
                      </li>
                    ))}
                  </ul>

                  {/* ALERTA BOX SE HOUVER */}
                  {licaoAtiva.alerta && (
                    <div className="mt-3.5 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl flex gap-3 text-xs text-amber-800 dark:text-amber-300 leading-normal">
                      <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div className="space-y-1">
                        <div className="font-extrabold uppercase tracking-wider text-[10px] text-amber-700 dark:text-amber-400 font-sans">
                          IMPORTANTE
                        </div>
                        <p className="font-medium">{licaoAtiva.alerta}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RODAPÉ DO CARD: REFERÊNCIAS BÍBLICAS E NOTAS IMPORTANTES */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3.5">
                {/* Referência Bíblica se houver - Badge de Texto Clicável para Abrir na Bíblia Integrada */}
                {licaoAtiva.ref && (
                  <div
                    className={`flex flex-col gap-1.5 p-3.5 border rounded-2xl ${
                      isAmber
                        ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-100/50 dark:border-amber-900/60 text-amber-900 dark:text-amber-200"
                        : "bg-[#E1F5EE]/30 dark:bg-teal-950/10 border-teal-100/50 dark:border-teal-900/60 text-teal-900 dark:text-teal-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500 font-sans">
                      <Bookmark className={`w-3.5 h-3.5 shrink-0 ${isAmber ? "text-amber-700 dark:text-amber-400" : "text-teal-700 dark:text-teal-400"}`} />
                      Fundamento Bíblico (Toque para abrir na Bíblia)
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {licaoAtiva.ref.split(" • ").map((part, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setBibleReference(part);
                            setIsBibleOpen(true);
                          }}
                          className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white hover:bg-neutral-50 dark:bg-zinc-90 w-fit border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-900 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer gap-1 shadow-sm font-sans"
                          title={`Abrir ${part} na Bíblia`}
                        >
                          <BookOpen className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>{part}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* CARD DE COMPROMISSO DO LÍDER NO ÚLTIMO PASSO */}
                {isFinalStep && (
                  <div
                    className="bg-neutral-50 dark:bg-[#121212]/50 p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col gap-3.5 mt-3 animate-slideUp"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400 font-sans">
                      <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      Assinatura de Compromisso
                    </div>
                    
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-snug">
                      Ao assinar abaixo, você confirma a leitura completa de cada ponto do manual de 2026 e se compromete oficialmente a zelar pelo Grupo de Amigos sob a supervisão do pastor de jovens.
                    </p>

                    <div className="space-y-3 mt-1">
                      {/* Input do Nome */}
                      <div>
                        <label
                          htmlFor="nome-completo"
                          className="block text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 font-sans"
                        >
                          Nome Completo do Líder
                        </label>
                        <input
                          id="nome-completo"
                          type="text"
                          required
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          placeholder="Digite seu nome completo"
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100 font-sans"
                        />
                      </div>

                      {/* Input de Data */}
                      <div>
                        <label
                          htmlFor="data-compromisso"
                          className="block text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 font-sans"
                        >
                          Data
                        </label>
                        <input
                          id="data-compromisso"
                          type="date"
                          required
                          value={data}
                          onChange={(e) => setData(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100 font-sans"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BOTÕES DE NAVEGAÇÃO "VOLTAR" / "PRÓXIMO" / "CONCLUIR" */}
            <footer className="mt-5 flex items-center gap-3">
              {/* Botão de Voltar (escondido no primeiro passo) */}
              {passo > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-3.5 h-11 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-semibold rounded-xl text-slate-700 dark:text-zinc-300 flex items-center justify-center gap-1.5 transition-all outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                  aria-label="Voltar para lição anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar
                </button>
              ) : (
                <div className="w-0" />
              )}

              {/* Botão Próximo / Concluir */}
              {isFinalStep ? (
                <button
                  type="button"
                  disabled={!nome.trim() || !data}
                  onClick={handleConcluirTrilha}
                  className={`flex-1 h-11 text-xs font-semibold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all text-white cursor-pointer shadow-lg ${
                    nome.trim() && data
                      ? "bg-[#0F6E56] hover:bg-[#1D9E75] hover:scale-[1.01] active:scale-[0.99] shadow-teal-700/10 font-bold"
                      : "bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 cursor-not-allowed shadow-none font-medium"
                  }`}
                  aria-label="Concluir a trilha de formação"
                >
                  Assinar Compromisso
                  <Sparkles className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className={`flex-1 h-11 text-xs font-semibold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all text-white cursor-pointer shadow-lg ${
                    isAmber
                      ? "bg-amber-600 hover:bg-amber-500 active:scale-[0.99] shadow-amber-600/15 font-bold"
                      : "bg-[#0F6E56] hover:bg-[#1D9E75] active:scale-[0.99] shadow-teal-700/15 font-bold"
                  }`}
                  aria-label="Avançar para o próximo capítulo"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </footer>
          </div>
        )}
      </main>

      {/* Simulated Home Indicator from Theme */}
      <div className="flex justify-center pb-2.5 pt-1.5 bg-neutral-50 dark:bg-[#121212] select-none rounded-b-[40px]">
        <div className="w-28 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full"></div>
      </div>
    </div>
  );
}
