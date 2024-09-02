// GraphQL provides reusable units called fragments.
// Fragments let you construct sets of fields, and then include them in queries where needed.
// You can use the fragments by including them as fields prefixed by 3 points "...".
// See documentation here: https://graphql.org/learn/queries/#fragments
// Try out yourself under https://indexer.kilt.io/ & https://dev-indexer.kilt.io/

export const wholeBlock = `
fragment wholeBlock on Block {
  id
  hash
  timeStamp
}`;

export const DidNames = `
fragment DidNames on Did {
  id
  web3NameId
}`;
