// Popula membros de exemplo para um líder (dados fictícios, só para teste/demonstração).
//
// Uso:
//   node server/seed-exemplos.js <email-do-lider>
// Com DATABASE_URL definida usa esse banco; sem ela, usa o Postgres local de desenvolvimento
// (o servidor de desenvolvimento precisa estar rodando: npm run dev).
// É idempotente: membros com o mesmo nome já cadastrados para o líder são ignorados.
import pg from 'pg';

const email = process.argv[2];
if (!email) {
  console.error('Informe o e-mail do líder: node server/seed-exemplos.js <email>');
  process.exit(1);
}

const url = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/leader_dev';

// Aniversários relativos a hoje, para que todas as seções da aba Aniversariantes tenham exemplos.
function dataRelativa(diasAFrente, anoNascimento) {
  const d = new Date();
  d.setDate(d.getDate() + diasAFrente);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${anoNascimento}-${mm}-${dd}`;
}

const EXEMPLOS = [
  { nome: 'Ana Beatriz Souza', nasc: dataRelativa(0, 2002), fone: '11987650001', amor: 'Palavras de Afirmação', min: 'Louvor', faixa: 'J2', ga: 'GA Ebenezer' },
  { nome: 'Bruno Almeida', nasc: dataRelativa(3, 2000), fone: '11987650002', amor: 'Tempo de Qualidade', min: 'Mídia', faixa: 'J2', ga: 'GA Ebenezer' },
  { nome: 'Carla Mendes', nasc: dataRelativa(6, 2004), fone: '11987650003', amor: 'Presentes', min: 'Recepção', faixa: 'J2', ga: 'GA Ebenezer' },
  { nome: 'Daniel Ferreira', nasc: dataRelativa(14, 1999), fone: '11987650004', amor: 'Atos de Serviço', min: 'Som', faixa: 'J2', ga: 'GA Maranata' },
  { nome: 'Eduarda Lima', nasc: dataRelativa(25, 2005), fone: '11987650005', amor: 'Toque Físico', min: '', faixa: 'J2', ga: 'GA Maranata' },
  { nome: 'Felipe Rocha', nasc: dataRelativa(45, 2001), fone: '11987650006', amor: 'Palavras de Afirmação', min: 'Louvor', faixa: 'J2', ga: 'GA Ebenezer' },
  { nome: 'Gabriela Torres', nasc: dataRelativa(80, 2006), fone: '11987650007', amor: 'Tempo de Qualidade', min: 'Infantil', faixa: 'J1', ga: 'GA Maranata' },
  { nome: 'Henrique Costa', nasc: dataRelativa(120, 1998), fone: '11987650008', amor: 'Presentes', min: 'Mídia', faixa: 'J2', ga: 'GA Ebenezer' },
  { nome: 'Isabela Martins', nasc: dataRelativa(170, 2003), fone: '11987650009', amor: 'Atos de Serviço', min: 'Recepção', faixa: 'J2', ga: 'GA Maranata' },
  { nome: 'João Pedro Nunes', nasc: dataRelativa(230, 2007), fone: '11987650010', amor: 'Toque Físico', min: '', faixa: 'J1', ga: 'GA Ebenezer' },
  { nome: 'Larissa Cardoso', nasc: dataRelativa(290, 2000), fone: '11987650011', amor: 'Palavras de Afirmação', min: 'Louvor', faixa: 'J2', ga: 'GA Maranata' },
  { nome: 'Mateus Barbosa', nasc: dataRelativa(340, 2002), fone: '11987650012', amor: 'Tempo de Qualidade', min: 'Som', faixa: 'J2', ga: 'GA Ebenezer' },
];

const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  const { rows: usuarios } = await client.query('SELECT id FROM usuarios WHERE email = $1', [email.trim().toLowerCase()]);
  if (usuarios.length === 0) {
    console.error(`Nenhum usuário encontrado com o e-mail ${email}.`);
    process.exit(1);
  }
  const liderId = usuarios[0].id;

  let criados = 0;
  for (const m of EXEMPLOS) {
    const { rows: existe } = await client.query('SELECT 1 FROM membros WHERE lider_id = $1 AND nome = $2', [liderId, m.nome]);
    if (existe.length > 0) continue;

    const notas = JSON.stringify({
      _meta: true,
      ga: m.ga,
      origemTransicao: m.faixa === 'J1',
      motivoAusencia: '',
      detalheAusencia: '',
      ultimoContato: '',
      responsavelContato: '',
      observacoes: 'Membro de exemplo',
    });

    await client.query(
      `INSERT INTO membros (lider_id, nome, contato1, aniversario, linguagem_amor, ministerio, faixa, data_entrada, notas, status, faltas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8, 'Ativo', 0)`,
      [liderId, m.nome, m.fone, m.nasc, m.amor, m.min, m.faixa, notas]
    );
    criados++;
  }
  console.log(`${criados} membros de exemplo criados (${EXEMPLOS.length - criados} já existiam).`);
} finally {
  await client.end();
}
