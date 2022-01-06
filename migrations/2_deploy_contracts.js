const ICO = artifacts.require("ICO.sol");

module.exports = function(deployer) {
  deployer.deploy(ICO, 'Sour Evas', 'SVA', 1000000, 18);
};
