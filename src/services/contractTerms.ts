export const CONTRATADA = {
  razaoSocial: "FGL SERVIÇO DE VIGILÂNCIA PATRIMONIAL E TERCEIRIZAÇÃO LTDA",
  cnpj: "34.647.639/0001-85",
  endereco:
    "Avenida Sagitário, nº 138 – Torre London – Sala 1214 – Alphaville Conde II – Barueri/SP – CEP: 06473-073",
};

export const PREAMBULO = `Presente instrumento particular, em que são partes, de um lado, ${CONTRATADA.razaoSocial}, inscrita no CNPJ nº ${CONTRATADA.cnpj} estabelecida na ${CONTRATADA.endereco}, neste ato representada na forma de seu Contrato Social, doravante denominada "CONTRATADA"; e, de outro lado, denominado "CONTRATANTE", têm entre si justa e contratada a prestação de serviços de rastreamento veicular, que se regerá pelas seguintes cláusulas e condições em que se obrigam as partes:`;

export interface ContractClause {
  titulo: string;
  paragrafos: string[];
}

export const CLAUSULAS: ContractClause[] = [
  {
    titulo: "1. OBJETO",
    paragrafos: [
      "1.1. O presente instrumento tem por objeto a prestação de serviços de Rastreamento Veicular, minimizando os riscos e oferecendo esforços para a eventual recuperação de veículo roubado ou furtado, dentro do território nacional, com a opção da prestação de serviço de Assistência 24 horas, de acordo com a Clausula 8, se adquirido este serviço no ato da contratação.",
      "1.2. Para a prestação do serviço especificado na Clausula 1.1, a CONTRATADA realizará o rastreamento do veículo, mediante sistema com tecnologia de localização GPS, por meio de equipamento eletrônico individual para este fim (COMODATO), instalado no bem disponibilizado pelo CONTRATANTE (Veículo), conforme indicado no anexo deste instrumento, sendo desde então, cedido à CONTRATADA o acesso irrestrito às informações de localização do veículo fornecido pelo sistema, durante a vigência deste contrato.",
      "1.3. Será cedido ao CONTRATANTE o acesso à localização do veículo através do software via internet e APP, emitida através do equipamento previamente instalado no veículo indicado pelo CONTRATANTE.",
    ],
  },
  {
    titulo: "2. ESFORÇOS PARA O RASTREAMENTO VEICULAR",
    paragrafos: [
      "2.1. Os serviços pactuados para a tentativa de recuperação do veículo compreendem exclusiva e restritivamente: (a) Localização do Veículo nas hipóteses previstas na Cláusula 1.2; (b) Reiteração e colaboração com as autoridades competentes ou Prestadores de Serviços Autorizados sobre a localização do Veículo; (c) Acionamento de Pronta Resposta que consiste no envio de equipe previamente estabelecida pela CONTRATADA, esgotando os meios para a recuperação do bem, a fim de reestabelecer a posse segura ao CONTRATANTE e/ou órgãos da segurança pública, desde que o equipamento ofereça real possibilidade para este procedimento, devendo estar em pleno funcionamento.",
    ],
  },
  {
    titulo: "3. CÓDIGO DE ACESSO",
    paragrafos: [
      "3.1. O Contratante receberá seu Código de Acesso (senha), ao término da instalação dos Equipamentos ou no prazo máximo de 07 (sete) dias úteis, sendo ele pessoal e secreto, de exclusiva responsabilidade do CONTRATANTE a divulgação para pessoas não autorizadas.",
    ],
  },
  {
    titulo: "4. OBRIGAÇÕES DO CONTRATANTE",
    paragrafos: [
      "INSTALAÇÃO E DESINSTALAÇÃO DO EQUIPAMENTO LOCALIZADOR",
      "4.1. Após a solicitação de agendamento emitida pelo SAC (Serviço de Atendimento ao Cliente), de ciência do CONTRATANTE, este deverá comparecer em local e horário agendado, com o veículo indicado no anexo deste Instrumento, objeto do Rastreamento Veicular contratado, para inspeção técnica, onde sendo aprovado será realizada a instalação do equipamento localizador.",
      "4.2. O não comparecimento do CONTRATANTE no agendamento prévio ensejará na cobrança da taxa de inspeção técnica determinada conforme tabela vigente à época do agendamento.",
      "4.3. No encerramento do contrato, não se renovando, rescindindo ou substituindo o veículo, deverá ser realizado agendamento para a retirada do equipamento, ato que se prontificará o CONTRATANTE a comparecer com o veículo no local e horário predeterminado.",
      "4.4. Caso o CONTRATANTE não disponibilize o veículo para retirada do equipamento nos termos da clausula anterior, obrigará o CONTRATANTE ao pagamento do valor em pecúnia equivalente ao equipamento, previsto conforme tabela vigente à época, com vencimento em 10 dias corridos a data do agendamento.",
      "4.5. O equipamentos serão instalados por Agente Técnico da CONTRATADA no veículo do CONTRATANTE, devendo o último expressamente seguir as instruções fornecidas pela CONTRATADA, bem como a somente submeter os Equipamentos aos cuidados de Agente Técnico da CONTRATADA, mediante agendamento junto ao SAC.",
      "4.6. A vigência deste contrato e suas obrigações terão eficácia a partir da aprovação do veículo em inspeção técnica e instalação do equipamento, bem como o pagamento do valor único ou do valor de entrada.",
      "Serviço de localização em caso de notificação de furto ou roubo do Veículo",
      "4.7. Em caso de furto ou roubo do veículo o CONTRATANTE é obrigado a: a) Comunicar a Central de Atendimento em no máximo 30 minutos, salvo motivos de força maior ou casos fortuitos, devidamente comprovados. b) Comunicar a Central de Operações da Polícia Militar (190) em no máximo 45 minutos; c) Registrar o fato através de Boletim de Ocorrência em no máximo 3 horas, devendo ser realizado o quanto antes possível, salvo quando comprovada a impossibilidade. d) Informar as Autoridades Policiais e Central de Operações da Polícia Militar no caso de recuperação do veículo; e) Comparecer ao local indicado pela Central de Atendimento, conforme orientação do operador, para reaver a posse do veículo, quando recuperado.",
      "4.8. Quando o veículo for recuperado, nos casos de roubo e furto, pelas Forças Policiais, o CONTRATANTE imediatamente informará a Central de Atendimento, informando as possíveis alterações no veículo, disponibilizando-o para inspeção técnica e instalação, se necessário, no prazo máximo de 24 horas, sob pena de suspensão do contrato e suas obrigações, até que seja sanada a situação.",
      "4.9. O CONTRATANTE reconhece e concorda que a notificação à CONTRATADA sobre o furto ou roubo do Veículo poderá acarretar ações da Polícia, que poderão ensejar ações legais conforme legislação vigente, sobre as quais não se responsabilizará a CONTRATADA, diante da ausência de vinculação.",
      "4.10. Em caso de falsa notificação, o CONTRATANTE compromete-se a reembolsar e/ou indenizar a CONTRATADA em relação a todos e quaisquer gastos e/ou prejuízos decorrentes do ato, com aplicação de multa equivalente ao valor proporcional de 20% (vinte por cento) do valor total do contrato.",
      "4.11. Quando Constatado que houve qualquer modificação, alteração ou manutenção relevante no veículo que possa ensejar no mal funcionamento do equipamento, comprometendo o rastreamento veicular, ficará isenta a CONTRATADA do pagamento da multa, sendo obrigação do CONTRATANTE comunicar a CONTRATADA de tais fatos, bem como comunica-la sobre eventuais problemas mecânicos ou elétricos que possam gerar vícios ao funcionamento do equipamento.",
      "4.12. O CONTRATANTE deverá manter seus dados cadastrais atualizados perante o sistema da CONTRATADA, devendo comunicar qualquer alteração de endereço e telefones.",
      "4.13. O CONTRATANTE deverá informar à CONTRATADA, no ato da contratação, se o local de pernoite do veículo é realizado em garagem ou via pública, sendo que na ausência desta informação subentende-se que o veículo é mantido em local fechado e seguro. O CONTRATANTE deverá estacionar o veículo em estacionamento privado ou garagem sempre que houver tal estabelecimento disponível em um raio de 500 metros nas proximidades do local estacionado, isentando a CONTRATADA da obrigação de pagamento de multa punitiva nas situações previstas na Cláusula 6, quando constatado o não cumprimento desta obrigação.",
      "Pagamentos das Mensalidades",
      "4.14. O CONTRATANTE deverá manter os pagamentos em dia, rigorosamente, conforme data de vencimento mensal, sob pena de suspensão imediata da prestação dos serviços, isentando a CONTRATADA da obrigação de pagamento de multa punitiva nas situações previstas na Cláusula 6.",
    ],
  },
  {
    titulo: "5. OBRIGAÇÕES DA CONTRATADA",
    paragrafos: [
      "5.1. Fornecer os equipamentos para o CONTRATANTE e substituí-los em caso de falhas ou defeitos, conforme Cláusula 4.1.",
      "5.2. A CONTRATADA deverá disponibilizar Equipe de Agentes Técnicos que realizarão a instalação do equipamento nos veículos do CONTRATANTE, conforme agendamento e local pré-definido.",
      "5.3. A CONTRATADA poderá, de acordo com seus critérios de qualidade, terceirizar ou credenciar a Equipe de Agentes Técnicos, permanecendo responsável pela instalação do equipamento e seu funcionamento.",
      "5.4. Prestar o serviço de tentativa de localização do veículo nos casos de roubo ou furto durante a vigência do contrato, de acordo com as previsões contidas na Cláusula 2.1, nos termos de suas atribuições.",
      "5.5. Disponibilizar para o CONTRATANTE uma Central de Atendimento 24 horas, com profissionais capacitados para atuar nas situações que prezem pela eficiência dos serviços prestados.",
      '5.6. Obriga-se a CONTRATADA a manter atendimento de suporte à CONTRATANTE, com capacidade para: 1) Prestar orientações via e-mail, fax e telefone durante o horário comercial, bem como o serviço de agendamento de instalação, manutenção e desinstalação: 2) Manter um servidor com conexão de Internet banda larga em um local com no-break, Data Center, para minimizar possíveis problemas com queda de conexão; 3) A contratada dará acesso ilimitado a contratante para visualizar seus veículos via web e app, conforme regulamentos deste contrato.',
    ],
  },
  {
    titulo: "6. MULTA",
    paragrafos: [
      "6.1. Não sendo o veículo localizado no período de 30 (trinta) dias a contar do momento da comunicação do furto ou roubo à Central de Atendimento, será devido ao CONTRATANTE, se cumpridas as cláusulas obrigacionais, o pagamento da multa, conforme valor da tabela FIPE vigente à época do fato, no valor máximo de R$18.000 (Dezoito mil Reais), mesmo que o valor de tabela do veículo seja superior a este estipulado, estando o CONTRATANTE ciente que não receberá qualquer valor excedente ao fixado nesta clausula.",
      "6.2. Qualquer vício oculto do veículo, chassis remarcado ou eventos que depreciem o valor de mercado, a multa contratual será reduzida à metade do valor ajustado.",
      "6.3. Sendo o veículo furtado ou roubado e posteriormente localizado por quem quer que seja, não será devida a multa por parte da CONTRATADA, salvo se comprovada a sua perda total ou o comprometimento da estrutura/mecânica/elétrica, desmontagem integral ou parcial, em todos os casos citados, quando a reforma seja superior a 75% (setenta e cinco por cento) do bem protegido, cabendo assim a multa prevista, desde que o CONTRATANTE não tenha dado causa ou cooperado para tais danos.",
      "Parágrafo único: O CONTRATANTE deverá, neste caso, comprovar o dano através de laudo fotográfico, devendo disponibilizar o veículo para vistoria por parte da CONTRATADA, bem como providenciar três orçamentos de empresas indicadas pela CONTRATADA.",
      "6.4. Para o pagamento da multa é imprescindível a apresentação dos seguintes documentos após 30 dias corridos contados a partir da data do furto ou roubo: a) Comprovante de quitação das obrigações pecuniárias, bem como das demais obrigações com a CONTRATADA (pagamento da mensalidade, parcelas vincenda em valor único); b) Boletim de Ocorrência; c) Formulário de descrição do furto ou roubo, preferencialmente escrito de próprio punho pelo CONTRATANTE ou usuário do veículo no momento do fato; d) Original do Certificado de Registro e Licenciamento do Veículo (CRLV), REGULARIZADO, apto a permitir transferência da propriedade, sem qualquer ressalva ou pendência financeira; e) Documento Único de Transferência (\"DUT\") assinado pelo CONTRATANTE ou proprietário do veículo, com firma reconhecida por verdadeira, transferindo a propriedade do veículo para a CONTRATADA ou para quem esta indicar; f) Demonstrativo de Débitos perante os órgãos de trânsito competentes até a data do furto/roubo (por meio da emissão de certidão oficial, sendo inaceitável a mera impressão de consulta pela internet); g) Termo de Responsabilidade por Multas, descrito de próprio punho declarando a responsabilidade do CONTRATANTE sob as multas incorridas ao veículo até a data do sinistro, com firma reconhecida; h) IPVA referente ao exercício anterior, até a data do furto/roubo, sendo aceitável o \"nada consta de débitos\" desde que acompanhado de comprovante do exercício anual; i) No caso de veículos adquiridos pela CONTRATANTE e/ou pelo proprietário por meio de financiamento, documento comprovando a quitação do referido contrato de financiamento; j) Chave original e reserva do veículo em caso de furto, ou chave reserva, em caso de roubo; k) Cópia do RG e CPF/MF e da CNH do CONTRATANTE e do condutor do veículo no momento do fato; l) Declaração do CONTRATANTE constando Banco, agência e Conta a ser depositada a multa.",
      "6.4.1 Na falta do DUT: original da Declaração de Extravio do DUT, endereçada ao órgão de trânsito competente, com firma reconhecida por verdadeira, bem como procuração outorgada pelo proprietário do veículo à CONTRATADA, com poderes específicos para, em nome do outorgante, comparecer aos órgãos de trânsito ou a qualquer outra repartição pública ou particular para regularizar a condição do veículo, com firma reconhecida, por verdadeira e cópia autenticada do RG, CPF/MF e comprovante de residência do CONTRATANTE ou proprietário do veículo.",
      "6.4.2 Caso o DUT esteja preenchido em nome do CONTRATANTE: Declaração de Endosso Indevido, com a firma reconhecida por verdadeira, e DUT assinado, com firma reconhecida por verdadeira.",
      "6.4.3 Caso o DUT esteja preenchido em nome de pessoa diversa do CONTRATANTE e da CONTRATADA: Procuração outorgada por referida pessoa à CONTRATADA no ato do fechamento deste Contrato, com poderes específicos, com firma reconhecida por verdadeira e cópia autenticada de RG, CPF/MF e comprovante de residência deste.",
      "6.5. É obrigatória a regularização dos documentos do veículo pelo CONTRATANTE, pois somente assim, os mesmos serão recebidos pela CONTRATADA que, por sua vez, em razão deste contrato, realizará o pagamento da multa.",
      "6.6. O pagamento da multa se fará após o 30º dia a contar da data da entrega de todos os documentos, podendo ser prorrogado pelo dobro do período, nos casos de suspeita de fraude, prazo necessário para a análise minuciosa da documentação e do fato.",
      "6.7. Sendo constatada a fraude por parte do CONTRATANTE, nas informações prestadas na contratação dos serviços, na perda do veículo mediante furto, roubo ou avaria superior a 75% do veículo após localização, estará desobrigada a CONTRATADA do pagamento da multa.",
      "6.8. Condições que desobrigam o CONTRATADO ao pagamento da multa: a) Sendo constatadas avarias mínimas ou não estruturais; b) Sendo constatadas avarias, ainda que estruturais, inferiores a 75% do veículo; c) Sendo constatado que o CONTRATANTE concorreu para o evento ou teve a intenção de agravar o risco, a situação e as avarias ao veículo, entre eles, manter o veículo em via pública quando há condições de mantê-lo em local seguro, como estacionamentos ou garagem própria próxima; d) Estando o CONTRATANTE com a CNH suspensa ou caçada, salvo em situações de furto em que o veículo permanecia estacionado em garagem ou estacionamento; e) Ocorrência de furto ou roubo parcial, que não resulte na perda do veículo; f) Ocorrência de incêndio, colisão, acidente ou enchente que envolvam o veículo; g) Inadimplência de qualquer valor devido pelo CONTRATANTE na data do fato — o CONTRATANTE deverá estar com o pagamento em dia (adimplente) no momento do sinistro, comprovando o pagamento com data de até um dia antes do fato; h) Não disponibilização do veículo para inspeção técnica, no caso de desabilitação do equipamento; i) Não apresentação de senha de identificação por parte do CONTRATANTE, que impossibilite o atendimento ágil da Central, comprometendo a recuperação do veículo; j) Disponibilizar o veículo para que outros Técnicos realizem a instalação ou manutenção do equipamento, que não sejam os técnicos cadastrados e agendados pela CONTRATADA; k) Falta de comunicação à CONTRATADA a respeito das alterações realizadas no veículo; l) Ocorrência de furto ou roubo ocorrido no momento em que o veículo esteja sendo dirigido, em posse de, ou ainda, sob a guarda de terceiros, que não seja o CONTRATANTE; m) Não apresentação da documentação prevista na Clausula 6.4; n) Evidencia de fraude na perda do veículo; o) Falta de comunicação do furto ou roubo em tempo previsto na clausula 4.7.",
    ],
  },
  {
    titulo: "7. PREÇO E CONDIÇÕES DE PAGAMENTO",
    paragrafos: [
      "7.1. O preço relativo à Adesão/Instalação e ao Plano de Rastreamento Veicular contratado estão descritos no anexo deste instrumento, bem como a forma de pagamento, ajustado conforme valor do veículo indicado e questionamento de risco.",
      "7.2. Na hipótese de escolha do pagamento parcelado por boleto bancário, e caso do Contratante não recebê-los, deverá contatar a Contratada, solicitando instruções de como proceder ao pagamento.",
      "7.3. O não pagamento dos valores pactuados no seu respectivo vencimento, implicará na cobrança de multa de 2%, juros de mora de 1% ao mês, além dos custos e despesas processuais de cobrança e correção monetária calculada pela aplicação do IGP-M/FGV e na sua falta, o índice que o substituir.",
      "7.4. Em havendo o não pagamento por um período superior a 30 (trinta) dias, a CONTRATADA poderá tomar todas as providências cabíveis para recuperação de seu crédito, inclusive a promoção de negativação do usuário perante os órgãos de proteção do crédito, além da rescisão do contrato, nos termos da clausula 9.6.a.",
      "7.5. Após um dia de inadimplência, a CONTRATADA irá suspender a prestação de serviços até que haja o pagamento devido dos valores vencidos, não estando obrigada ao pagamento da multa, nos casos previstos, independente de aviso ou notificação.",
      "7.6. Para o reestabelecimento dos serviços, o CONTRATANTE deverá efetivar o pagamento total, com os acréscimos previstos.",
      "7.7. Na hipótese da Cláusula 7.5, o CONTRATANTE ficará obrigado a disponibilizar o veículo para a retirada do equipamento, estando sujeito ao previsto na Clausula 9.2.",
    ],
  },
  {
    titulo: "8. SERVIÇOS DE ASSISTÊNCIA 24 HORAS",
    paragrafos: [
      "8.1. Em Caso de eventos fortuitos com o veículo indicado no anexo a este Contrato e que impossibilite sua locomoção, o CONTRATANTE poderá solicitar através da Central de Assistência 24 horas os serviços descritos a seguir.",
      "8.2. Reboque: Para transporte do veículo indicado que se encontra em via pública, local em que se deu a impossibilidade de locomoção, até oficina mais próxima ou indicada pela Assistência 24 horas, limitado a 200 (duzentos) quilômetros, sendo 100 (cem) quilômetros de ida e 100 (cem) quilômetros de volta, em no máximo duas vezes por ano. O serviço de reboque limitar-se-á ao transporte unicamente do veículo, eximindo a CONTRATADA da responsabilidade por objetos ou cargas no interior do veículo.",
      "8.2.1 A CONTRATANTE deverá seguir as determinações e limitações impostas pela Empresa Terceirizada de Assistência, não sendo responsabilidade da CONTRATADA qualquer regra atribuída ao CONTRATANTE por parte da Empresa Terceirizada.",
      "8.3. Chaveiro: Para abertura do veículo indicado no anexo a este contrato, nos casos de perda ou extravio das chaves. Não estão cobertas a confecção das chaves, custos diversos de mão de obra, peças e consertos de fechaduras ou ignição.",
    ],
  },
  {
    titulo: "9. PRAZO E RESCISÃO",
    paragrafos: [
      "9.1. Este Contrato é firmado por tempo determinado, terá o prazo de 12 (doze) meses.",
      "9.2. Havendo resilição imotivada, não será devido ao CONTRATANTE, a restituição do valor proporcional ao período de tempo que o contrato deixará de vigorar, sendo cobrado do CONTRATANTE o pagamento da taxa de desinstalação do equipamento, sob pena de pagamento do valor do equipamento conforme tabela vigente à época, sem prejuízo de multa rescisória, caso a resilição ocorra dentro do prazo por tempo determinado previsto na cláusula 9.3, no valor de 50% das parcelas vincendas até o termino do prazo contratual.",
      "9.3. Sendo contrato por tempo determinado pelo período de 12 meses, não havendo manifestação expressa do CONTRATANTE para a sua resolução, com antecedência mínima de 30 dias, este passará a vigorar por prazo indeterminado.",
      "9.4. Na hipótese de venda ou qualquer outro motivo que impeça o rastreamento veicular ao veículo indicado no anexo deste instrumento, haverá a rescisão do presente contrato, nos termos da clausula 9.2.",
      "9.5. O não cumprimento de qualquer clausula pelo CONTRATANTE aqui prevista, autoriza a CONTRATADA a suspender a prestação de serviços, independentemente de prévia comunicação, bem como sua rescisão, perdurando o descumprimento por mais de dez dias, salvo disposição contrária que preveja a rescisão independentemente da suspensão dos serviços.",
      "9.6. A CONTRATADA poderá encerrar a prestação dos Serviços conforme este Contrato, a qualquer tempo, mediante notificação ao endereço de faturamento do CONTRATANTE, sem cumprir período de prévio aviso, em casos de: (a) parcelas com o pagamento em atraso na forma da Cláusula 7.4; (b) uso indevido do Equipamento e Serviços pelo CONTRATANTE; (c) destruição ou danos ao Equipamento, de modo que os Serviços não possam mais ser prestados; ou (d) nos casos de força maior ou casos fortuitos.",
      "9.7. O CONTRATANTE deverá notificar a CONTRATADA, através de seus meios de comunicação, SAC, e-mail e WhatsApp, em casos de rescisão, estabelecendo o prazo de 10 dias para as providências previstas na Clausula 9.2.",
    ],
  },
  {
    titulo: "10. DISPOSIÇÕES GERAIS",
    paragrafos: [
      "10.1. A CONTRATADA não é responsável por eventual perda de garantia de fábrica de veículo em razão da instalação do equipamento.",
      "10.2. Não é permitido ao CONTRATANTE troca do veículo objeto deste contrato, não podendo ser o equipamento transferido a outro veículo, sob pena de rescisão, arcando com as demais penalidades previstas neste contrato.",
      "10.3. A CONTRATADA não se responsabiliza pelas pessoas ou objetos, cargas e demais coisas no interior do veículo, bem como por acidentes com ou sem terceiros envolvidos, danos externo e internos no veículo e danos pessoais em nenhuma espécie.",
      "10.4. O CONTRATANTE tem neste ato, tem pleno conhecimento de que o funcionamento dos equipamentos, sistema, bem como a localização e recuperação do veículo, dependem de fatores que fogem a competência da CONTRATADA, dos quais podemos citar o tempo decorrente entre a ocorrência do roubo ou furto e o acionamento da Central de Atendimento; da colaboração das partes envolvidas como o Usuário do Veículo; incluindo outros aspectos e circunstâncias, como bloqueadores de sinais, problemas de rede telefônica, condições climáticas e topográficas, dentre outras situações que reflitam caso fortuito e de força maior. Resta assim, a CONTRATADA utilizar todos os recursos e instrumentos ao seu alcance, nos termos do presente instrumento, para localizar os Veículos sinistrados, nos limites especificados acima.",
      "10.5. Fica esclarecido que o vínculo ora estabelecido entre a CONTRATADA e o CONTRATANTE não constitui e não representa, em hipótese alguma, um contrato de seguro, não havendo e/ou não implicando em qualquer cobertura, de qualquer natureza, para o CONTRATANTE, Usuários, Condutores, Veículo e/ou terceiros. Restando a obrigação da CONTRATADA, quando localizado, o dever de comunicação às autoridades competentes, conforme previsto na Cláusula 4.12.",
      "10.6. A CONTRATADA não garante e não se responsabiliza pela efetiva recuperação do veículo, sendo que na hipótese de localização e/ou recuperação, a contratada não se responsabiliza pelo estado de conservação do veículo, bem como por quaisquer objetos, pertences ou acessórios que se encontravam no interior ou exterior dele.",
      "10.7. Se qualquer disposição deste Contrato ou de seus Anexos for declarada inválida, ilegal ou inexequível, a exequibilidade das disposições remanescentes não serão afetadas por tal declaração.",
      "10.8. A aceitação, por qualquer das Partes, do não cumprimento, pela outra, de qualquer cláusula ou disposições deste Contrato, a qualquer tempo, será interpretada como mera liberalidade, não implicando em renúncia do direito de exigir o fiel cumprimento das obrigações aqui pactuadas.",
      "10.9. Este Contrato é regido pelas leis da República Federativa do Brasil. Na eventualidade de alguma cláusula ser considerada nula por algum tribunal ou autoridade, este Contrato não será anulado sendo que as demais disposições permanecerão em vigor.",
      "10.10. O Contratante declara que leu todas as Cláusulas do presente Contrato e que conhece e entende o seu conteúdo, inclusive a essência e os pormenores dos Serviços contemplados neste Contrato, e que atesta serem compatíveis com a sua necessidade sob o aspecto do tipo, especificação, qualidade e característica dos Serviços.",
      "10.11. O Contrato obriga as partes contratantes e seus sucessores a qualquer título.",
      "10.12. Qualquer alteração e/ou aditamento do presente Contrato somente produzirá efeitos legais quando feitos por escrito e devidamente assinado pelas partes.",
    ],
  },
  {
    titulo: "11. FORO E JURISDIÇÃO",
    paragrafos: [
      "11.1 As partes elegem o Foro Central Da Capital de São Paulo, com exclusão de qualquer outro, por mais privilegiado que seja, para dirimir todas e quaisquer questões ou conflitos oriundos deste cumprimento.",
    ],
  },
];

export const TEXTO_ACEITE = "Aceito os Termos e Condições.";
