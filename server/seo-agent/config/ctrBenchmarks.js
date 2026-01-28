// CTR Benchmarks by Position
// Industry standard baselines for decision making

module.exports = {
  // Expected CTR by SERP position
  CTR_BY_POSITION: {
    1: 0.28,  // 28% CTR for position 1
    2: 0.15,  // 15% CTR for position 2
    3: 0.11,  // 11% CTR for position 3
    4: 0.08,  // 8% CTR for position 4
    5: 0.07,  // 7% CTR for position 5
    6: 0.05,  // 5% CTR for position 6
    7: 0.04,  // 4% CTR for position 7
    8: 0.03,  // 3% CTR for position 8
    9: 0.03,  // 3% CTR for position 9
    10: 0.03, // 3% CTR for position 10
  },
  
  // Fallback for positions > 10
  DEFAULT_CTR_LOW: 0.02,   // 2% for positions 11-20
  DEFAULT_CTR_VERY_LOW: 0.01, // 1% for positions 21+
  
  // Get expected CTR for a given position
  getExpectedCTR(position) {
    if (position <= 10) {
      return this.CTR_BY_POSITION[position] || this.DEFAULT_CTR_LOW;
    } else if (position <= 20) {
      return this.DEFAULT_CTR_LOW;
    } else {
      return this.DEFAULT_CTR_VERY_LOW;
    }
  },
  
  // Check if actual CTR is below expected
  isUnderperforming(position, actualCTR) {
    const expected = this.getExpectedCTR(position);
    return actualCTR < (expected * 0.7); // 30% below expected
  },
};
