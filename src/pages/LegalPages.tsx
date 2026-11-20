interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-slate-500">Última atualização: novembro de 2026</p>

      <Section title="1. Processamento local das imagens">
        <p>
          A principal característica do Imagem Fácil é que <strong>todas as ferramentas processam suas imagens
          diretamente no seu navegador</strong>. Suas imagens <strong>nunca são enviadas, armazenadas ou
          visualizadas por nós</strong> — não saem do seu dispositivo em nenhum momento.
        </p>
      </Section>

      <Section title="2. Dados que coletamos">
        <p>
          <strong>Formulário de contato:</strong> se você entrar em contato, coletamos o nome, e-mail, assunto e
          mensagem que você informar, exclusivamente para responder à sua solicitação.
        </p>
        <p>
          <strong>Dados técnicos:</strong> podemos coletar informações anônimas de uso (como páginas visitadas)
          para melhorar o site. Isso não inclui o conteúdo das suas imagens.
        </p>
        <p>
          <strong>Cookies de publicidade:</strong> exibimos anúncios por meio de parceiros como o Google AdSense,
          que podem usar cookies para personalizar anúncios com base em suas visitas a este e outros sites. Você
          pode desativar a personalização nas configurações da sua Conta Google.
        </p>
      </Section>

      <Section title="3. Uso dos dados">
        <p>
          Utilizamos os dados do formulário de contato apenas para responder à sua mensagem. Não vendemos, alugamos
          nem compartilhamos suas informações pessoais com terceiros, exceto quando exigido por lei.
        </p>
      </Section>

      <Section title="4. Retenção e exclusão">
        <p>
          As mensagens de contato são mantidas apenas pelo tempo necessário para atender à sua solicitação. Você pode
          solicitar a exclusão dos seus dados a qualquer momento pelo e-mail contato@imagemfacil.com.br.
        </p>
      </Section>

      <Section title="5. Seus direitos (LGPD)">
        <p>
          Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode solicitar acesso,
          correção, portabilidade ou exclusão dos seus dados pessoais, bem como revogar consentimentos concedidos.
        </p>
      </Section>

      <Section title="6. Segurança">
        <p>
          O site utiliza conexão segura (HTTPS) e, como as imagens não saem do seu dispositivo, o risco de
          exposição delas é inerentemente mínimo.
        </p>
      </Section>

      <Section title="7. Contato">
        <p>
          Dúvidas sobre esta política? Acesse nossa página de <strong>Contato</strong> ou escreva para
          contato@imagemfacil.com.br.
        </p>
      </Section>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Termos de Uso</h1>
      <p className="mt-2 text-sm text-slate-500">Última atualização: novembro de 2026</p>

      <Section title="1. Aceitação dos termos">
        <p>
          Ao acessar e utilizar o Imagem Fácil, você concorda com estes Termos de Uso. Se não concordar com
          qualquer disposição, por favor não utilize o site.
        </p>
      </Section>

      <Section title="2. Descrição do serviço">
        <p>
          O Imagem Fácil oferece ferramentas gratuitas de edição e otimização de imagens (compressão, conversão de
          formato, redimensionamento, corte e conversão para PDF) que funcionam integralmente no navegador do
          usuário, sem necessidade de cadastro.
        </p>
      </Section>

      <Section title="3. Uso permitido">
        <p>Você concorda em utilizar as ferramentas apenas para fins lícitos. É proibido usar o site para:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Processar conteúdo ilegal, ofensivo ou que viole direitos de terceiros;</li>
          <li>Distribuir material protegido por direitos autorais sem autorização;</li>
          <li>Tentar sobrecarregar, invadir ou desestabilizar o serviço;</li>
          <li>Utilizar robôs ou scripts automatizados de forma abusiva.</li>
        </ul>
      </Section>

      <Section title="4. Propriedade das imagens">
        <p>
          As imagens que você processa permanecem sendo sua propriedade. Como elas não são enviadas aos nossos
          servidores, não temos acesso a elas nem qualquer responsabilidade sobre seu conteúdo.
        </p>
      </Section>

      <Section title="5. Isenção de garantias">
        <p>
          O serviço é oferecido "no estado em que se encontra", sem garantias de disponibilidade contínua ou de
          resultados específicos. Recomendamos sempre manter cópias dos arquivos originais antes de qualquer
          processamento.
        </p>
      </Section>

      <Section title="6. Limitação de responsabilidade">
        <p>
          Na máxima extensão permitida pela lei, o Imagem Fácil não será responsável por danos indiretos,
          incidentais ou consequenciais decorrentes do uso do site, incluindo perda de dados ou arquivos.
        </p>
      </Section>

      <Section title="7. Publicidade">
        <p>
          O site pode exibir anúncios de terceiros (como Google AdSense). O conteúdo dos anúncios é de
          responsabilidade exclusiva dos anunciantes.
        </p>
      </Section>

      <Section title="8. Alterações">
        <p>
          Podemos atualizar estes Termos a qualquer momento. Alterações entram em vigor na data de publicação
          nesta página.
        </p>
      </Section>

      <Section title="9. Contato">
        <p>Dúvidas sobre estes termos? Acesse nossa página de Contato.</p>
      </Section>
    </div>
  );
}
