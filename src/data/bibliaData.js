// Biblioteca offline de versículos do manual do GA de Jovens em várias versões (NVI, ARA, NTLH, KJV)
export const CODIGO_VERSO_CHAVE = {
  "1joao-3-16": {
    ref: "1 João 3:16",
    NVI: "Nisto conhecemos o que é o amor: Jesus Cristo deu a sua vida por nós, e devemos dar a nossa vida por nossos irmãos.",
    ARA: "Nisto conhecemos o amor: que Cristo deu a sua vida por nós; e nós devemos dar a vida pelos irmãos.",
    NTLH: "Sabemos o que é o amor por causa disto: Cristo deu a sua vida por nós. Por isso nós também devemos dar a nossa vida pelos nossos irmãos.",
    KJV: "Hereby perceive we the love of God, because he laid down his life for us: and we ought to lay down our lives for the brethren."
  },
  "atos-2-42": {
    ref: "Atos 2:42",
    NVI: "Eles se dedicavam ao ensino dos apóstolos e à comunhão, ao partir do pão e às orações.",
    ARA: "E perseveravam na doutrina dos apóstolos e na comunhão, no partir do pão e nas orações.",
    NTLH: "E todos continuavam firmes, seguindo os ensinamentos dos apóstolos, vivendo em amor cristão, partilhando as refeições juntos e orando.",
    KJV: "And they continued stedfastly in the apostles' doctrine and fellowship, and in breaking of bread, and in prayers."
  },
  "hebreus-10-25": {
    ref: "Hebreus 10:25",
    NVI: "Não deixemos de reunir-nos como igreja, segundo o costume de alguns, mas procuremos encorajar-nos uns aos outros, ainda mais ao ver que o Dia se aproxima.",
    ARA: "Não deixando a nossa congregação, como é costume de alguns, antes admoestando-nos uns aos outros e tanto mais quanto vedes que se vai aproximando aquele dia.",
    NTLH: "Não abandonemos a nossa assembleia, como alguns costumam fazer, mas pelo contrário, exortemo-nos mutuamente, e tanto mais quanto vedes que o dia se aproxima.",
    KJV: "Not forsaking the assembling of ourselves together, as the manner of some is; but exhorting one another: and so much the more, as ye see the day approaching."
  },
  "1timoteo-3-1-3": {
    ref: "1 Timóteo 3:1-3",
    NVI: "Fiel é esta palavra: Se alguém aspira ao episcopado, excelente obra almeja. É necessário, portanto, que o bispo seja irrepreensível, esposo de uma só mulher, temperante, sóbrio, modesto, hospitaleiro, apto para ensinar, não dado ao vinho, não violento, mas cordato, inimigo de contendas, não avarento.",
    ARA: "Fiel é a palavra: se alguém aspira ao episcopado, excelente obra almeja. É necessário, portanto, que o bispo seja irrepreensível, esposo de uma só mulher, temperante, sóbrio, modesto, hospitaleiro, apto para ensinar; não dado ao vinho, não violento, mas cordato, inimigo de contendas, não avarento.",
    NTLH: "Este ensinamento é verdadeiro: se alguém quer muito ser líder na igreja, está desejando um trabalho excelente. O líder deve ser um homem que ninguém possa culpar de nada. Deve ter somente uma esposa, ser moderado, ajuizado e simples. Deve estar pronto para receber pessoas na sua casa e ser capaz de ensinar. Não deve ser bêbado, nem violento; mas deve ser delicado e pacífico e não gostar de dinheiro.",
    KJV: "This is a true saying, If a man desire the office of a bishop, he desireth a good work. A bishop then must be blameless, the husband of one wife, vigilant, sober, of good behaviour, given to hospitality, apt to teach; Not given to wine, no striker, not greedy of filthy lucre; but patient, not a brawler, not covetous."
  },
  "1corintios-6-18": {
    ref: "1 Coríntios 6:18",
    NVI: "Fujam da imoralidade sexual. Todos os outros pecados que alguém comete, fora do corpo os comete; mas quem peca sexualmente peca contra o seu próprio corpo.",
    ARA: "Fugi da impureza. Qualquer outro pecado que uma pessoa cometer é fora do corpo; mas aquele que pratica a imoralidade peca contra o seu próprio corpo.",
    NTLH: "Fujam da imoralidade sexual! Qualquer outro pecado que alguém comete não afeta o corpo de quem o comete. Mas quem comete imoralidade sexual peca contra o seu próprio corpo.",
    KJV: "Flee fornication. Every sin that a man doeth is without the body; but he that committeth fornication sinneth against his own body."
  },
  "efesios-5-3": {
    ref: "Efésios 5:3",
    NVI: "Mas a imoralidade sexual e qualquer espécie de impureza ou cobiça não devem sequer ser mencionadas entre vocês, como convém a santos.",
    ARA: "Mas a impudicícia e toda sorte de impurezas ou cobiça nem sequer se nomeiem entre vós, como convém a santos.",
    NTLH: "Vocês pertencem ao povo de Deus; portanto, a imoralidade sexual, os pensamentos sujos e a ganância não devem ser nem assunto de conversa entre vocês.",
    KJV: "But fornication, and all uncleanness, or covetousness, let it not be once named among you, as becometh saints."
  },
  "filipenses-4-8": {
    ref: "Filipenses 4:8",
    NVI: "Finalmente, irmãos, tudo o que for verdadeiro, tudo o que for nobre, tudo o que for correto, tudo o que for puro, tudo o que for amável, tudo o que for de boa fama, se houver algo de excelente ou digno de louvor, pensem nessas coisas.",
    ARA: "Finalmente, irmãos, tudo o que é verdadeiro, tudo o que é respeitável, tudo o que é justo, tudo o que é puro, tudo o que é amável, tudo o que é de boa fama, se alguma virtude há e se algum louvor existe, seja isso o que ocupe o vosso pensamento.",
    NTLH: "Por último, meus irmãos, encham a mente de vocês com tudo o que é bom e merece elogios, isto é, tudo o que é verdadeiro, digno, correto, puro, agradável e de boa fama.",
    KJV: "Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things."
  }
};

// Seletor geral de livros com capítulos para busca avançada local-first (ou online fallback)
export const LIVROS_BIBLIA = [
  { id: "joao", nome: "João", capMax: 21 },
  { id: "1joao", nome: "1 João", capMax: 5 },
  { id: "atos", nome: "Atos", capMax: 28 },
  { id: "hebreus", nome: "Hebreus", capMax: 13 },
  { id: "1timoteo", nome: "1 Timóteo", capMax: 6 },
  { id: "1corintios", nome: "1 Coríntios", capMax: 16 },
  { id: "efesios", nome: "Efésios", capMax: 6 },
  { id: "filipenses", nome: "Filipenses", capMax: 4 },
  { id: "salmos", nome: "Salmos", capMax: 150 },
  { id: "proverbios", nome: "Provérbios", capMax: 31 },
  { id: "mateus", nome: "Mateus", capMax: 28 },
  { id: "romanos", nome: "Romanos", capMax: 16 }
];

// Fallback interativo para simulação rápida local se o usuário buscar outros capítulos
export const VERSICULOS_POPULARES = {
  "joao-3-16": {
    ref: "João 3:16",
    NVI: "Porque Deus tanto amou o mundo que deu o seu Filho Unigênito, para que todo o que nele crer não pereça, mas tenha a vida eterna.",
    ARA: "Porque Deus amou ao mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
    NTLH: "Porque Deus amou o mundo de tal maneira que deu o seu Filho único, para que todo aquele que nele crer não morra, mas tenha a vida eterna.",
    KJV: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
  },
  "salmos-23-1": {
    ref: "Salmos 23:1",
    NVI: "O Senhor é o meu pastor; de nada terei falta.",
    ARA: "O Senhor é o meu pastor; nada me faltará.",
    NTLH: "O Senhor é o meu pastor; de nada precisarei.",
    KJV: "The Lord is my shepherd; I shall not want."
  },
  "proverbios-3-5": {
    ref: "Provérbios 3:5",
    NVI: "Confie no Senhor de todo o seu coração e não se apóie em seu próprio entendimento.",
    ARA: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.",
    NTLH: "Confie no Senhor de todo o coração e não se apóie na sua própria inteligência.",
    KJV: "Trust in the Lord with all thine heart; and lean not unto thine own understanding."
  },
  "romanos-8-28": {
    ref: "Romanos 8:28",
    NVI: "Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.",
    ARA: "Sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.",
    NTLH: "Nós sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados de acordo com o seu plano.",
    KJV: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose."
  }
};
