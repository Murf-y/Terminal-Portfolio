import type { Paper } from '@models/paper'

/** Newest first. Links resolve through doi.org so they survive server moves. */
export const PAPERS: Paper[] = [
  {
    title: 'A Scale-Free Network for Modeling a Homogeneous Ensemble',
    authors: ['Fayad, C.', 'Eid, C.'],
    year: 2026,
    venue: 'Authorea preprint',
    doi: '10.22541/au.177187903.32641814/v1',
    abstract:
      'Ensemble learning aims to enhance predictions by aggregating multiple learners through a model ensemble and thus facilitating a more accurate capture of underlying data distribution. This study proposes a scale-free network-based ensemble learning (NEL) algorithm based on neural networks as base learners, allowing for a balance between individual base learner accuracy and diversity. Optimal weights for ensemble integration are calculated based on the centrality of a node in the heterogeneous network. The scale-free topology of NEL inherently allows for ensemble pruning due to its power-law degree distribution. Experimental results derived from averaging the ensemble performance over ten runs show the favorability and robustness of our approach.',
    tags: ['Ensemble Learning', 'Scale-Free Networks', 'Neural Networks'],
    githubLink: 'https://github.com/Murf-y/NetworkedEnsembleLearning',
  },
  {
    title:
      'Adaptive Neural Topologies: A Dynamic Approach to Learning Network Structures during Training',
    authors: ['Fayad, C.'],
    year: 2025,
    venue: 'TechRxiv preprint',
    doi: '10.36227/techrxiv.176240389.96859753/v1',
    abstract:
      'This paper introduces the Adaptive Topology Neural Network (ATNN), an architecture that dynamically optimizes its connections to emulate the efficiency of biological neural networks. Starting as a fully connected network, ATNN adapts to a sparser topology by utilizing an edge importance metric to selectively rewire non-important connections, enabling skip connections similar to ResNet. Empirical evaluations across 8 classification datasets demonstrate that ATNN significantly outperforms standard fixed-topology ANNs in MSE, accuracy, precision, and recall.',
    tags: ['Neural Networks', 'Adaptive Topology', 'Machine Learning'],
    githubLink: 'https://github.com/Murf-y/Adaptive-Topology-Neural-Network-ATNN',
  },
  {
    title:
      'A Scale-Free Network-Based Genetic Algorithm with Balanced Exploration and Exploitation',
    authors: ['Hoblos, Y.', 'Fayad, C.'],
    year: 2025,
    venue: 'engrXiv preprint',
    doi: '10.31224/5690',
    abstract:
      'Genetic algorithms (GA) are widely used to solve complex computational problems. This paper introduces a novel network-based approach that utilizes phenotypic and genotypic similarities to establish inter-chromosomal links. Based on the scale-free property of the Barabasi-Albert (BA) model, we dynamically assign authority nodes to drive the evolutionary process. Comparative evaluations against panmictic GA and a previously developed network-based genetic algorithm demonstrate favorable results. The assessments involve the average best fitness over 50 runs conducted on eight well-known benchmark functions.',
    tags: ['Genetic Algorithms', 'Scale-Free Networks', 'Optimization'],
    githubLink: 'https://github.com/Murf-y/Enhanced-Networked-Genetic-Algorithm',
  },
]

const DOI_RESOLVER = 'https://doi.org/'

export function paperUrl(paper: Paper): string {
  return DOI_RESOLVER + paper.doi
}
