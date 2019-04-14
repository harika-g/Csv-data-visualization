from django.shortcuts import render,redirect
from django.http import StreamingHttpResponse
import os
from django.conf import settings
import numpy as np
import pandas as pd
from dateutil import parser

#Function to invoke template with the graphs

def displayCharts(request,filename):
    path = settings.MEDIA_ROOT+os.sep+filename
    #print("file path in home"+path)
    #filename = path.split(os.sep)[-1]
    return render(request,'Reports/charts.html',{'path':filename})

# UploadFile handles the uploaded csv file
def UploadFile(request):
    if request.method == 'POST':
        file = request.FILES['Excelfile']
        #if(file.content_type == 'application/vnd.ms-excel'):
        if(file.name.endswith(".csv")):
            handle_uploaded_file(request.FILES['Excelfile'])
            return redirect('/reports/'+file.name)
        else:
            return render(request,'Reports/UploadFile.html')
    else:
        return render(request,'Reports/UploadFile.html')

#Uploading the csv file to media folder
def handle_uploaded_file(f):
    path = str(settings.MEDIA_ROOT)+os.sep+"Reports"+os.sep+f.name
    with open(path, 'wb+') as destination:
        for chunk in f.chunks():
            destination.write(chunk)

#updated_weights:
#1.Get all the numerical data from csv
#2.Compute the y-co ordinate for the trendline of each graph using linear regression
#3.Return the co-efficients of each trendline to the template i.e., a,b values for all lines of form 'ax+b'
 
def updated_weights(request,filepath):
    print("file in updated data",filepath)
    file = pd.read_csv(settings.MEDIA_ROOT+os.sep+"Reports"+os.path.sep+filepath)
    print("file read")
    #print(type(file.columns.values))
    filecols = [h.strip(' ') for h in file.columns.values]

    # If there is Session details column in data, remove Time as it cannot be used for computation
    if("Session" in filecols):
        colindex = filecols.index("Time")
        file.drop(columns = [file.columns.values[colindex]],axis = 1,inplace = True)
    print("columns",file.columns.values)
    
    time = []
    session = False
    for t in file[file.columns[0]]:
        try:
            time.append(parser.parse(t))
        except:
            time = file[file.columns[0]]
            session = True
            break
    time = np.array(time)
    print("1")
    #print(time)
    #Computing the time difference for x-co ordinate. Each entry of time is converted to time - starttime
    deltas = []
    for t in time:
        if(session == False):
            deltas.append((t - time[0]).total_seconds())
        else:
            deltas = time
            break
    deltas = np.array(deltas)
    print("2")
    cols=[]
    for col in range(len(file.columns)-1):
        cols.append(file[file.columns[col+1]])
    '''
    #if first column is not date deltas can be directly the data
    deltas = [t+1 for t in range(len(file))]
    print(deltas)
    deltas = np.array(deltas)
    '''
    count_arr = [i+1 for i in range(len(deltas))]
    count_arr = np.array(count_arr)
    a =[]
    b=[]
    #res = []
    print("deltas",deltas)
    #print(cols)
    print("3")
    for x in range(len(cols)):
        print("cols",x,"is ",cols[x]);
        print("4")
        #z = np.polyfit(deltas, cols[x], 1)
        #p = np.poly1d(z)
        #a.append(z[1])
        #b.append(z[0])

        #linear regression technique
        denominator = deltas.dot(deltas) - (deltas.mean() * deltas.sum())
        print(type(cols[x].mean()))
        print(type(deltas[0]))
        b.append(( float(deltas.dot(cols[x])) - (float(cols[x].mean())*(deltas.sum())) ) / denominator)
        a.append(( cols[x].mean() * deltas.dot(deltas) - deltas.mean() * deltas.dot(cols[x])) / denominator)
        
        print("5")
        #x_sum = np.sum(deltas)
        #denom = (x_sum*x_sum)-(deltas.size*np.dot(deltas,deltas))
        #a.append(((np.dot(deltas,cols[x])*x_sum)-(np.dot(deltas,deltas)*np.sum(cols[x])))/denom)
        #b.append(((x_sum*np.sum(cols[x]))-(deltas.size*np.dot(deltas,cols[x])))/denom)
        #res.append(a[x]+(b[x]*deltas))
    #print(a,b)
    a_joined = ','.join(str(w) for w in a)
    b_joined = ','.join(str(w) for w in b)
    print("6")
    return StreamingHttpResponse(a_joined+";"+b_joined)
