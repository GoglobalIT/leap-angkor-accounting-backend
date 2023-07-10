


const dashboardResolver = {
  Query: {
    getBarChart: (_root: undefined, { _id }: { _id: String }, req: any)=>{
        return "Dashboard query write in a separagte file for make easy find later"
    }
  }
  
};

export default dashboardResolver