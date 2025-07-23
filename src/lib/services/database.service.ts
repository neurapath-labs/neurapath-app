const BASE_URL = "https://production.eveapp2021.workers.dev/";

export const getDatabaseByID = async (id: string) => {
  const response = await fetch(`${BASE_URL}${id}.json`);
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return {};
};