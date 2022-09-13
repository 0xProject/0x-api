import { gql, request } from 'graphql-request';

const queryPools = (
    skip: number,
    pageSize: number,
    createdBy = '',
    dataProvider = ''
  ) => gql`
    {
      pools(first: ${pageSize}, skip: ${skip},
        orderDirection: desc,
        orderBy: createdAt,
        where: { 
          createdBy_contains: "${createdBy}"
          statusFinalReferenceValue_not: "Confirmed"
          dataProvider_contains: "${dataProvider}"
        }) {
        id
        referenceAsset
        floor
        inflection
        cap
        supplyInitial
        supplyShort
        supplyLong
        expiryTime
        collateralToken {
          id
          name
          decimals
          symbol
        }
        collateralBalanceShortInitial
        collateralBalanceLongInitial
        collateralBalance
        shortToken {
          id
          name
          symbol
          decimals
          owner
        }
        longToken {
          id
          name
          symbol
          decimals
          owner
        }
        finalReferenceValue
        statusFinalReferenceValue
        redemptionAmountLongToken
        redemptionAmountShortToken
        statusTimestamp
        dataProvider
        redemptionFee
        settlementFee
        createdBy
        createdAt
        capacity
        expiryTime
        challenges {
          challengedBy
          proposedFinalReferenceValue
        }
      }
    }
  `

export const fetchPoolLists = async (page: number, pageSize: number, createdBy: string, graphUrl: string) => {
  const result = await request(
    graphUrl,
    queryPools(
      Math.max(page, 0) * pageSize,
      pageSize,
      createdBy,
      undefined
    )
  )

  return result.pools;
}