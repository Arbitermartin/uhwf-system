export interface EventItem {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    content: string | null;
    image_url: string | null;
    location: string | null;
    start_date: string;
    end_date: string | null;
    is_published: boolean;
    created_by: number | null;
    created_at: string;
    updated_at: string;
    creator_name?: string | null;
}

export interface NewsItem {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    image_url: string | null;
    is_published: boolean;
    published_at: string | null;
    created_by: number | null;
    created_at: string;
    updated_at: string;
    creator_name?: string | null;
}

export interface Paginated<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface EventFormData {
    title: string;
    description: string;
    content: string;
    image_url: string;
    location: string;
    start_date: string; // datetime-local value
    end_date: string;
    is_published: boolean;
}

export interface NewsFormData {
    title: string;
    excerpt: string;
    content: string;
    image_url: string;
    is_published: boolean;
}
