

const GlobalType = `#graphql
    scalar Date
    type ResponseMessage{
        isSuccess: Boolean
        message: String
    }
    type Paginator {
        slNo: Int
        prev: Int
        next: Int
        perPage: Int
        totalPosts: Int
        totalPages: Int
        currentPage: Int
        hasPrevPage: Boolean
        hasNextPage: Boolean
        totalDocs: Int
    }
`;

export default GlobalType
