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
        Registre ingredientes e insumos com controle de preços unitários e
        histórico de compras. Use OCR para importar notas fiscais
        automaticamente.
      </>
    ),
  },
  {
    title: 'Criação de Receitas',
    emoji: '📋',
    description: (
      <>
        Monte receitas ou produtos finais com cálculo automático dos custos
        diretos. Defina sua margem de lucro e obtenha o preço de venda
        sugerido.
      </>
    ),
  },
  {
    title: 'Cálculo Automático',
    emoji: '💰',
    description: (
      <>
        Calcule automaticamente o custo total e obtenha sugestão de preço de
        venda baseada na margem de lucro configurada — sem planilhas manuais.
      </>
    ),
  },
];

function Feature({title, emoji, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-vert--md">
        <span style={{fontSize: '3rem'}}>{emoji}</span>
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
