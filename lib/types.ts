export type Candidate = {
  id: string;
  name: string;
  slug: string;
  state_uf: string;
  state_name: string;
  cargo: string;
  party: string | null;
  number: string | null;
  photo_url: string | null;
  biography: string | null;
  proposals: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
  status: "draft" | "published";
};

export type State = {
  uf: string;
  name: string;
  region: string;
};
