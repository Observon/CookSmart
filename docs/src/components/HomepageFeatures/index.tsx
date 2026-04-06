import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  emoji: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Gestão de Ingredientes',
    emoji: '🥕',
    description: (
      <>
        Registre ingredientes com preço unitário e histórico de compras.
        O OCR com Amazon Textract agiliza o lançamento de notas fiscais.
      </>
    ),
  },
  {
    title: 'Cálculo de Receitas',
    emoji: '📋',
    description: (
      <>
        Monte receitas e obtenha automaticamente o custo total e a sugestão
        de preço de venda baseada na margem de lucro configurada.
      </>
    ),
  },
  {
    title: 'Controle Financeiro',
    emoji: '💰',
    description: (
      <>
        Acompanhe a evolução de custos, registre compras e tome decisões
        estratégicas com relatórios claros e intuitivos.
      </>
    ),
  },
];

function Feature({title, emoji, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center" style={{fontSize: '4rem'}}>
        {emoji}
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
