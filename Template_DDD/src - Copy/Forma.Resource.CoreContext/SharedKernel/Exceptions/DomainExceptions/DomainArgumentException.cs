using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Forma.CoreContext.SharedKernel.Exceptions.DomainExceptions;

public class DomainArgumentException : BaseDomainException
{
    public DomainArgumentException(string message): base(message)
    {
        
    }
}
