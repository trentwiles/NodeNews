interface Props {
    title: string;
    details: string;
    color: string;
    onClose: () => void;
}

const Alert = (holder: Props) => {
  return (
    <>
      <div className={`bg-${holder.color}-900 text-center py-4 lg:px-4`}>
        <div
          className={`p-2 bg-${holder.color}-800 items-center text-${holder.color}-100 leading-none lg:rounded-full flex lg:inline-flex`}
          role="alert"
        >
          <span className={`flex rounded-full bg-${holder.color}-500 uppercase px-2 py-1 text-xs font-bold mr-3`}>
            {holder.title}
          </span>
          <span className="font-semibold mr-2 text-left flex-auto">
            {holder.details}
          </span>
          <svg
            className="fill-current opacity-75 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            onClick={onclick}
            
          >
            <path d="M12.95 10.707l.707-.707L8 4.343 6.586 5.757 10.828 10l-4.242 4.243L8 15.657l4.95-4.95z" />
          </svg>
        </div>
      </div>
    </>
  );
};

export default Alert;
