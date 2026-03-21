export abstract class HeatResultsHarnessBase {
  static readonly hostSelector = 'app-heat-results';

  static readonly selectors = {
    rankingsGraph: '.rankings-graph',
    laptimesGraph: '.laptimes-graph',
    legend: '.legend',
    legendItems: '.legend g',
    rankLines: '.rankings-graph path',
    lapLines: '.laptimes-graph path'
  };

  abstract getRankingsGraph(): Promise<any>;
  abstract getLaptimesGraph(): Promise<any>;
  abstract getLegendItemCount(): Promise<number>;
}
