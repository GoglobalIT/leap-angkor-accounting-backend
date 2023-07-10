import { iDepartment } from "../../interface/iDepartment";
import GeneralJournal from "../../models/generalJournal";
import {paginationLabel} from "../../functions/paginationLabel";


const generalJournalResolver = {
  Query: {
    getJournalById: async (_root: undefined, {journal_id}:{journal_id: String}) => {
      try {
        const getById = await GeneralJournal.findById(journal_id)
        return getById
      } catch (error) {
        console.log(error.message)
      }
    },
    getLastJournalNumber: async(_root: undefined, {}) => {
      try {
        let journalNumber = 1
        const getLastJournal = await GeneralJournal.findOne({}).sort({createdAt: -1}).limit(1)
        if(getLastJournal){
          journalNumber = getLastJournal.journal_number + 1
        }
        return journalNumber
      } catch (error) {
        
      }
    },
    getJournalWithPagination: async (_root: undefined, {page, limit, keyword, pagination}: {page: number, limit: number, keyword: string, pagination: boolean})=>{
      try {
        
        const options = {
          page: page || 1,
          limit: limit || 10,
          pagination: pagination,
          customLabels: paginationLabel,
          sort: {createdAt: -1},
          populate: 'journal_entries.chart_account_id created_by',
        };

        const query = {}

        const getData = await GeneralJournal.paginate(query, options);

        return getData

      } catch (error) {
        console.log(error)
      }
    }
  },
  Mutation: {
    createJournal: async (_root: undefined, { input }: { input: iDepartment }) => {
      try {
        let journalNumber = 1
        const getLastJournal = await GeneralJournal.findOne({}).sort({createdAt: -1}).limit(1)
        if(getLastJournal){
          journalNumber = getLastJournal.journal_number + 1
        }
        const isCreated = await new GeneralJournal({
          ...input,
          journal_number: journalNumber
        }).save();
        if (!isCreated) {
          return {
            isSuccess: false,
            message: "Create Journal Unsuccessful !"
          }
        }
        return {
          isSuccess: true,
          message: "Create Journal Successfully"
        }
      } catch (error) {
        return {
          isSuccess: false,
          message: "Error, " + error.message
        }
      }
    },
    updateJournal: async (_root: undefined, { journal_id, input }: { journal_id: String, input: iDepartment }) => {
      try {

        const isUpdated = await GeneralJournal.findByIdAndUpdate(journal_id, input);
        if (!isUpdated) {
          return {
            isSuccess: false,
            message: 'Update Journal Unsuccessful'
          }
        }
        return {
          isSuccess: true,
          message: 'Update Journal Successfully'
        }
      } catch (error) {
        return {
          isSuccess: false,
          message: 'Error, ' + error.message
        }
      }
    },
    deleteJournal: async (_root: undefined, { journal_id }: { journal_id: String },) => {
      try {
        const isDeleted = await GeneralJournal.findByIdAndDelete(journal_id);
        if (!isDeleted) {
          return {
            isSuccess: false,
            message: "Delete JournalUnsuccessful !"
          }
        }
        return {
          isSuccess: true,
          message: "Delete Journal Successfully"
        }
      } catch (error) {
        return {
          isSuccess: false,
          message: "Error, "+error.message
        }
      }
    }
  }
};

export default generalJournalResolver