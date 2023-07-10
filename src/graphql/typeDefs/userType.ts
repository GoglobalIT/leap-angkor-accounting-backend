


const userType = `#graphql

  type User {
    _id: ID
    user_first_name: String
    user_last_name: String
    user_email: String
    user_image_name: String
    user_image_src: String 
    role: String
    status: Boolean
    createdAt: Date
    updatedAt: Date
  }
  type UserPaginator{
    data: [User]
    paginator: Paginator
  }
  input UserInput {
    user_first_name: String
    user_last_name: String
    user_email: String
    password: String
    user_image_name: String
    user_image_src: String 
    role: String
    status: Boolean
  }

  type Query {
    getUserById(_id: ID!): User
    getUserLogin: User
    getUserWithPagination(page: Int, limit: Int, keyword: String, pagination: Boolean): UserPaginator
  }
  type Mutation {
    createUser(input: UserInput): ResponseMessage
    updateUser(_id: ID!, input: UserInput): ResponseMessage
    deleteUser(_id: ID!): ResponseMessage
  }
`;

export default userType