export interface Violation {
    constraint: string;
    tfg: string[];
    violatedVertices: string[];
    inducingVertices: string[];
}