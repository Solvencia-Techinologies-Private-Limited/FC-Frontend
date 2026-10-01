import { Product } from '../product-modal.model';

export type SelectorKind =
  | 'sphere'
  | 'toric'
  | 'highLowMF'
  | 'domNoDom';

export type LabelStyle =
  | 'light'
  | 'lightSmall'
  | 'bold';

export interface LabelPart {
  text: string;
  style: LabelStyle;
}

export interface OrderResult {
  oldResult: string;
  otherParameters: Record<string, string>;
}

export interface SelectorCell {
  id: string;
  label: LabelPart[];
  order: OrderResult;
  variant?: 'dom' | 'nodom';
}

export interface SelectorSection {
  index: number;
  headerTitle: string;
  plusMinus: string;
  color: string;
  cells: SelectorCell[];
}

export interface SelectorLayout {
  columns: number;
  cellWidth: number;
  cellHeight: number;
  otherCellHeight?: number;
  offsetX: number;
  offsetY: number;
}

export interface SelectorModel {
  kind: SelectorKind;
  sections: SelectorSection[];
  layout: SelectorLayout;
}

export function unsupportedMessage(
  _product: Product
): string | null {
  return null;
}

export function selectorKindFor(
  product: Product
): SelectorKind {

  if (
    product.axis?.length &&
    product.cylinder?.length
  ) {
    return 'toric';
  }

  return 'sphere';
}

export function buildSelectorModel(
  product: Product
): SelectorModel {

  const powers =
    product.sphere?.[0]?.slice(1) ?? [];

  const baseCurve =
    product.baseCurve?.[1] ??
    product.baseCurve?.[0] ??
    '';

  return {
    kind: selectorKindFor(product),

    sections: [
      {
        index: 0,
        headerTitle: baseCurve
          ? `BC: ${baseCurve}`
          : 'Power',

        plusMinus: '+ Plus Powers +',

        color: '#4f8f4c',

        cells: powers.map(
          (power, index) => ({
            id: `0:${index}`,

            label: [
              {
                text: `${baseCurve} `,
                style: 'lightSmall'
              },
              {
                text: power,
                style: 'bold'
              }
            ],

            order: {
              oldResult: `BC:${baseCurve} Power:${power}`,
              otherParameters: {
                BC: baseCurve,
                Power: power
              }
            }
          })
        )
      }
    ],

    layout: {
      columns: 5,
      cellWidth: 165,
      cellHeight: 82,
      offsetX: 33,
      offsetY: 32
    }
  };
}