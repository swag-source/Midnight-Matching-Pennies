// test/final-tests.js
const { expect } = require('chai');

// Import the runtime functions
const {
  QueryContext,
  sampleContractAddress,
  constructorContext
} = require('@midnight-ntwrk/compact-runtime');

// Import your contract
const { Contract, ledger } = require('../contract/index.cjs');

// Import witnesses
const { witnesses } = require('../scripts/witnesses.js');

describe('Complete Matching Pennies Game Test', () => {
  
  let contract, circuitContext;
  let player1, player2;
  
  beforeEach(() => {
    // Fresh setup for each test
    contract = new Contract(witnesses);
    const coinPublicKey = "0".repeat(64);
    const initialStateResult = contract.initialState(
      constructorContext({}, coinPublicKey)
    );

    circuitContext = {
      currentPrivateState: initialStateResult.currentPrivateState,
      currentZswapLocalState: initialStateResult.currentZswapLocalState,
      originalState: initialStateResult.currentContractState,
      transactionContext: new QueryContext(
        initialStateResult.currentContractState.data,
        sampleContractAddress()
      )
    };

    // Create player addresses
    player1 = Buffer.alloc(32);
    player1.write("player1", 0);
    
    player2 = Buffer.alloc(32);
    player2.write("player2", 0);
  });

  it('Complete Game Flow: Player 1 wins (same choices)', async () => {
    console.log("🎮 Testing complete game flow where Player 1 wins...");
    
    // Step 1: Players join
    console.log("👥 Players joining...");
    let result = contract.impureCircuits.joinGame(circuitContext, player1);
    circuitContext = result.context;
    
    result = contract.impureCircuits.joinGame(circuitContext, player2);
    circuitContext = result.context;
    
    let gameState = ledger(circuitContext.transactionContext.state);
    expect(gameState.state).to.equal(0); // State.unavailable = 0
    console.log("✅ Both players joined, lobby closed");

    // Step 2: Players choose coins
    console.log("🪙 Players choosing coins...");
    
    // Player 1 chooses heads (0)
    result = contract.impureCircuits.chooseCoin(circuitContext, player1, 0);
    circuitContext = result.context;
    
    // Player 2 chooses heads (0) - same choice, Player 1 should win
    result = contract.impureCircuits.chooseCoin(circuitContext, player2, 0);
    circuitContext = result.context;
    
    gameState = ledger(circuitContext.transactionContext.state);
    expect(gameState.player1_decision).to.equal(1); // Decision.decided = 1
    expect(gameState.player2_decision).to.equal(1);
    console.log("✅ Both players committed to their choices");

    // Step 3: Players reveal coins
    console.log("🔓 Players revealing coins...");
    
    // Get the salts that were used (in real scenario, players would store these)
    const player1Salt = Array.from(witnesses.saltFunction());
    const player2Salt = Array.from(witnesses.saltFunction());
    
    // Player 1 reveals heads
    result = contract.impureCircuits.revealCoin(circuitContext, player1, 0, player1Salt);
    circuitContext = result.context;
    
    // Player 2 reveals heads  
    result = contract.impureCircuits.revealCoin(circuitContext, player2, 0, player2Salt);
    circuitContext = result.context;
    
    console.log("✅ Both players revealed their choices");

    // Step 4: Play the game
    console.log("🏆 Determining winner...");
    result = contract.impureCircuits.playMatchingPennies(circuitContext);
    circuitContext = result.context;
    
    const finalState = ledger(circuitContext.transactionContext.state);
    
    // Verify results
    expect(finalState.player1_score).to.equal(1); // Player 1 wins
    expect(finalState.player2_score).to.equal(0);
    expect(finalState.round).to.equal(1);
    expect(finalState.state).to.equal(1); // State.available = 1 (reset for new game)
    
    console.log("🎉 Player 1 wins! Scores - P1:", finalState.player1_score, "P2:", finalState.player2_score);
    console.log("📊 Round:", finalState.round);
  });

  it('Complete Game Flow: Player 2 wins (different choices)', async () => {
    console.log("🎮 Testing complete game flow where Player 2 wins...");
    
    // Setup game (join players)
    let result = contract.impureCircuits.joinGame(circuitContext, player1);
    circuitContext = result.context;
    result = contract.impureCircuits.joinGame(circuitContext, player2);
    circuitContext = result.context;

    // Player 1 chooses heads (0), Player 2 chooses tails (1)
    result = contract.impureCircuits.chooseCoin(circuitContext, player1, 0);
    circuitContext = result.context;
    result = contract.impureCircuits.chooseCoin(circuitContext, player2, 1);
    circuitContext = result.context;

    // Reveal choices
    const player1Salt = Array.from(witnesses.saltFunction());
    const player2Salt = Array.from(witnesses.saltFunction());
    
    result = contract.impureCircuits.revealCoin(circuitContext, player1, 0, player1Salt);
    circuitContext = result.context;
    result = contract.impureCircuits.revealCoin(circuitContext, player2, 1, player2Salt);
    circuitContext = result.context;

    // Play game
    result = contract.impureCircuits.playMatchingPennies(circuitContext);
    circuitContext = result.context;
    
    const finalState = ledger(circuitContext.transactionContext.state);
    
    // Verify Player 2 wins (different choices)
    expect(finalState.player1_score).to.equal(0);
    expect(finalState.player2_score).to.equal(1); // Player 2 wins
    expect(finalState.round).to.equal(1);
    
    console.log("🎉 Player 2 wins! Scores - P1:", finalState.player1_score, "P2:", finalState.player2_score);
  });

  it('Multiple rounds tracking scores correctly', async () => {
    console.log("🔄 Testing multiple rounds...");
    
    // Round 1: Player 1 wins
    await playCompleteRound(0, 0); // Both choose heads, P1 wins
    let gameState = ledger(circuitContext.transactionContext.state);
    expect(gameState.player1_score).to.equal(1);
    expect(gameState.player2_score).to.equal(0);
    expect(gameState.round).to.equal(1);
    
    // Round 2: Player 2 wins
    await playCompleteRound(0, 1); // P1: heads, P2: tails, P2 wins
    gameState = ledger(circuitContext.transactionContext.state);
    expect(gameState.player1_score).to.equal(1);
    expect(gameState.player2_score).to.equal(1);
    expect(gameState.round).to.equal(2);
    
    // Round 3: Player 2 wins again
    await playCompleteRound(1, 0); // P1: tails, P2: heads, P2 wins
    gameState = ledger(circuitContext.transactionContext.state);
    expect(gameState.player1_score).to.equal(1);
    expect(gameState.player2_score).to.equal(2);
    expect(gameState.round).to.equal(3);
    
    console.log("✅ Multiple rounds completed! Final scores - P1:", gameState.player1_score, "P2:", gameState.player2_score);
    
    // Helper function for playing a complete round
    async function playCompleteRound(p1Choice, p2Choice) {
      // Join
      let result = contract.impureCircuits.joinGame(circuitContext, player1);
      circuitContext = result.context;
      result = contract.impureCircuits.joinGame(circuitContext, player2);
      circuitContext = result.context;
      
      // Choose
      result = contract.impureCircuits.chooseCoin(circuitContext, player1, p1Choice);
      circuitContext = result.context;
      result = contract.impureCircuits.chooseCoin(circuitContext, player2, p2Choice);
      circuitContext = result.context;
      
      // Reveal
      const p1Salt = Array.from(witnesses.saltFunction());
      const p2Salt = Array.from(witnesses.saltFunction());
      result = contract.impureCircuits.revealCoin(circuitContext, player1, p1Choice, p1Salt);
      circuitContext = result.context;
      result = contract.impureCircuits.revealCoin(circuitContext, player2, p2Choice, p2Salt);
      circuitContext = result.context;
      
      // Play
      result = contract.impureCircuits.playMatchingPennies(circuitContext);
      circuitContext = result.context;
    }
  });

  it('Error cases: Cannot reveal before committing', async () => {
    console.log("❌ Testing error case: reveal before commit...");
    
    // Join players
    let result = contract.impureCircuits.joinGame(circuitContext, player1);
    circuitContext = result.context;
    result = contract.impureCircuits.joinGame(circuitContext, player2);
    circuitContext = result.context;

    // Try to reveal without committing first
    try {
      const salt = Array.from(witnesses.saltFunction());
      result = contract.impureCircuits.revealCoin(circuitContext, player1, 0, salt);
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).to.include("has not committed yet");
      console.log("✅ Correctly prevented reveal before commit");
    }
  });

  it('Error cases: Cannot play before both reveals', async () => {
    console.log("❌ Testing error case: play before reveals...");
    
    // Setup: join and commit
    let result = contract.impureCircuits.joinGame(circuitContext, player1);
    circuitContext = result.context;
    result = contract.impureCircuits.joinGame(circuitContext, player2);
    circuitContext = result.context;
    result = contract.impureCircuits.chooseCoin(circuitContext, player1, 0);
    circuitContext = result.context;
    result = contract.impureCircuits.chooseCoin(circuitContext, player2, 1);
    circuitContext = result.context;

    // Try to play without revealing
    try {
      result = contract.impureCircuits.playMatchingPennies(circuitContext);
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).to.include("must reveal before");
      console.log("✅ Correctly prevented playing before reveals");
    }
  });

  it('Error cases: Cannot reveal twice', async () => {
    console.log("❌ Testing error case: double reveal...");
    
    // Setup: join and commit
    let result = contract.impureCircuits.joinGame(circuitContext, player1);
    circuitContext = result.context;
    result = contract.impureCircuits.joinGame(circuitContext, player2);
    circuitContext = result.context;
    result = contract.impureCircuits.chooseCoin(circuitContext, player1, 0);
    circuitContext = result.context;

    // First reveal (should work)
    const salt = Array.from(witnesses.saltFunction());
    result = contract.impureCircuits.revealCoin(circuitContext, player1, 0, salt);
    circuitContext = result.context;

    // Second reveal (should fail)
    try {
      result = contract.impureCircuits.revealCoin(circuitContext, player1, 0, salt);
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).to.include("already revealed");
      console.log("✅ Correctly prevented double reveal");
    }
  });

});