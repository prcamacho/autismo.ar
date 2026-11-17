import type { ArticleInput } from "./model";

export type ArticleProfile = {
  id: string;
  user_id: string;
  display_name: string;
  cafecito_slug: string | null;
  cafecito_approved: boolean;
  revision: number;
  decision_note: string | null;
  updated_at: string;
};

export type PublicArticleAuthor = Pick<
  ArticleProfile,
  "id" | "display_name" | "cafecito_slug"
>;

export type ArticleDraft = {
  id: string;
  author_id: string;
  data: ArticleInput;
  revision: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  decision_note: string | null;
  updated_at: string;
  created_at: string;
};

/** Public columns only: auth user IDs are deliberately excluded from SELECT grants. */
export type PublishedArticle = {
  id: string;
  profile_id: string;
  data: ArticleInput;
  version: number;
  published_at: string;
  visible: boolean;
};

export type ArticleRevision = {
  article_id: string;
  version: number;
  data: ArticleInput;
  published_at: string;
};

export type ArticleReport = {
  id: string;
  article_id: string;
  author_id: string;
  reason: string;
  status: "open" | "resolved";
  decision_note: string | null;
  created_at: string;
};

type Table<Row> = { Row: Row; Insert: never; Update: never; Relationships: [] };

export type ArticleTables = {
  article_profiles: Table<ArticleProfile>;
  article_drafts: Table<ArticleDraft>;
  articles: Table<PublishedArticle>;
  article_revisions: Table<ArticleRevision>;
  article_reports: Table<ArticleReport>;
};

export type ArticleFunctions = {
  article_author: { Args: { p_id: string }; Returns: PublicArticleAuthor[] };
  article_profile_save: {
    Args: {
      p_name: string;
      p_cafecito_slug: string | null;
      p_revision: number;
    };
    Returns: string;
  };
  article_profile_moderate: {
    Args: {
      p_profile: string;
      p_revision: number;
      p_approved: boolean;
      p_note: string;
    };
    Returns: undefined;
  };
  article_save: {
    Args: { p_id: string | null; p_data: ArticleInput; p_revision: number };
    Returns: string;
  };
  article_submit: {
    Args: { p_article: string; p_revision: number };
    Returns: undefined;
  };
  article_moderate: {
    Args: {
      p_article: string;
      p_revision: number;
      p_decision: "approved" | "rejected";
      p_note: string;
    };
    Returns: undefined;
  };
  article_withdraw: { Args: { p_article: string }; Returns: undefined };
  article_report: {
    Args: { p_article: string; p_reason: string };
    Returns: undefined;
  };
  article_resolve_report: {
    Args: { p_report: string; p_note: string; p_hide: boolean };
    Returns: undefined;
  };
};
