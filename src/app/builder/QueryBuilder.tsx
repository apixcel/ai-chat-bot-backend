/* eslint-disable @typescript-eslint/no-explicit-any */
class QueryBuilder {
  private query: Record<string, unknown>;
  private prismaQuery: Record<string, any>;

  constructor(query: Record<string, unknown>) {
    this.query = query;
    this.prismaQuery = {};
  }

  search(searchableFields: string[]) {
    const searchTerm = this.query.searchTerm as string;
    if (searchTerm) {
      this.prismaQuery = {
        ...this.prismaQuery,
        where: {
          OR: searchableFields.map((field) => ({
            [field]: { contains: searchTerm, mode: "insensitive" }, // Case-insensitive search
          })),
        },
      };
    }
    return this;
  }

  filter() {
    const queryObj = { ...this.query };
    const excludeFields = ["searchTerm", "sort", "limit", "page", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);

    this.prismaQuery = {
      ...this.prismaQuery,
      where: {
        ...this.prismaQuery.where,
        ...queryObj,
      },
    };

    return this;
  }

  sort() {
    const sort = (this.query.sort as string)?.split(",")?.join(" ") || "-createdAt";
    this.prismaQuery = {
      ...this.prismaQuery,
      orderBy: sort.split(" ").map((field) => {
        const direction = field.startsWith("-") ? "desc" : "asc";
        return { [field.replace("-", "")]: direction };
      }),
    };
    return this;
  }

  paginate() {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.prismaQuery = {
      ...this.prismaQuery,
      skip,
      take: limit,
    };

    return this;
  }

  fields() {
    const fields = (this.query.fields as string)?.split(",") || [];
    if (fields.length > 0) {
      this.prismaQuery = {
        ...this.prismaQuery,
        select: fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
      };
    }
    return this;
  }

  getPrismaQuery(whereQuery?: Record<string, unknown>) {
    if (!whereQuery) {
      return this.prismaQuery as { [x: string]: never };
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return {
      ...this.prismaQuery,
      where: {
        ...this.prismaQuery.where,
        ...whereQuery,
      },
    } as { [x: string]: never };
  }

  getMetaQuery() {
    return {
      currentPage: Number(this.query.page) || 1,
      limit: Number(this.query.limit) || 10,
    };
  }
}

export default QueryBuilder;
