import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<T> = {
  saltFunction(context: __compactRuntime.WitnessContext<Ledger, T>): [T, Uint8Array];
}

export type ImpureCircuits<T> = {
  joinGame(context: __compactRuntime.CircuitContext<T>, player_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  commitCoin(context: __compactRuntime.CircuitContext<T>,
             player_0: Uint8Array,
             coin_0: number): __compactRuntime.CircuitResults<T, []>;
  revealCoin(context: __compactRuntime.CircuitContext<T>,
             player_0: Uint8Array,
             coin_0: number,
             salt_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  playMatchingPennies(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
}

export type PureCircuits = {
}

export type Circuits<T> = {
  joinGame(context: __compactRuntime.CircuitContext<T>, player_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  commitCoin(context: __compactRuntime.CircuitContext<T>,
             player_0: Uint8Array,
             coin_0: number): __compactRuntime.CircuitResults<T, []>;
  revealCoin(context: __compactRuntime.CircuitContext<T>,
             player_0: Uint8Array,
             coin_0: number,
             salt_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  playMatchingPennies(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
}

export type Ledger = {
  readonly state: number;
  readonly round: bigint;
  readonly player1: Uint8Array;
  readonly player2: Uint8Array;
  readonly player1_score: bigint;
  readonly player2_score: bigint;
  readonly player1_commitment: Uint8Array;
  readonly player2_commitment: Uint8Array;
  readonly player1_decision: number;
  readonly player2_decision: number;
  result: {
    isEmpty(): boolean;
    length(): bigint;
    head(): { is_some: boolean, value: Uint8Array };
    [Symbol.iterator](): Iterator<Uint8Array>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<T, W extends Witnesses<T> = Witnesses<T>> {
  witnesses: W;
  circuits: Circuits<T>;
  impureCircuits: ImpureCircuits<T>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<T>): __compactRuntime.ConstructorResult<T>;
}

export declare function ledger(state: __compactRuntime.StateValue): Ledger;
export declare const pureCircuits: PureCircuits;
