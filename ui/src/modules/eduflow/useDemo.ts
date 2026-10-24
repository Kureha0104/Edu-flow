import { useQuery } from "@apollo/client";
import { DEMO_QUERY } from "~/graphql";

export const useEduflowDemo = (role: string, memberId?: string) => {
  const { data, loading, error, refetch } = useQuery(DEMO_QUERY, {
    variables: { role, memberId },
    fetchPolicy: "cache-and-network",
  });

  return { demo: data?.eduflowDemo, loading, error, refetch };
};
